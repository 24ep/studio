import * as React from 'react';
import Link from 'next/link';
import { Controller, type UseFormReturn } from 'react-hook-form';
import { ArrowTopRightOnSquareIcon, ClockIcon, ComputerDesktopIcon } from '@heroicons/react/24/outline';

import { Input } from '@/components/ui/input';
import type { Grade, Position } from '@/lib/types';
import type { EditPositionFormValues } from './position-edit-form';
import {
  PositionGradeFieldRow,
  PositionLevelFieldRow,
  PositionRecruiterFieldRow,
  PositionStatusFieldRow,
  PositionTextFieldRow,
} from './PositionDetailsFieldRows';
import { DetailsFieldRow } from './PositionDetailsFieldRowPrimitives';

export interface PositionDetailsFieldsProps {
  availableRecruiters: Array<{ id: string; name: string; avatarUrl?: string | null; personalColor?: string | null }>;
  form: UseFormReturn<EditPositionFormValues>;
  grades: Grade[];
  isEditMode: boolean;
  isLoadingLevels: boolean;
  position: Position;
  positionLevels: Array<{ id: string; name: string; color?: string }>;
}

export function PositionDetailsFields({
  availableRecruiters,
  form,
  grades,
  isEditMode,
  isLoadingLevels,
  position,
  positionLevels,
}: PositionDetailsFieldsProps) {
  const [clients, setClients] = React.useState<Array<{ id: string; name: string }>>([]);
  const [assetTypes, setAssetTypes] = React.useState<string[]>(['Access card', 'Headset', 'Laptop', 'Monitor', 'Phone']);
  const selectedAssetTypes = form.watch('onboardingAssetTypes') || [];
  const selectedClientId = form.watch('onboardingClientId');

  React.useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch('/api/hr/clients?pageSize=100', { credentials: 'include', cache: 'no-store' }),
      fetch('/api/hr/v1/assets?pageSize=100', { credentials: 'include', cache: 'no-store' }),
    ]).then(async ([clientResponse, assetResponse]) => {
      const clientPayload = clientResponse.ok ? await clientResponse.json() : {};
      const assetPayload = assetResponse.ok ? await assetResponse.json() : {};
      if (cancelled) return;
      const clientRows = clientPayload?.resource?.records || clientPayload?.records || clientPayload?.data || [];
      setClients(Array.isArray(clientRows) ? clientRows.filter((item: unknown): item is { id: string; name: string } => {
        return Boolean(item && typeof item === 'object' && typeof (item as { id?: unknown }).id === 'string' && typeof (item as { name?: unknown }).name === 'string');
      }) : []);
      const assetRows = Array.isArray(assetPayload?.data) ? assetPayload.data : [];
      const inventoryTypes = assetRows.map((item: Record<string, unknown>) => item.assetType).filter((item: unknown): item is string => typeof item === 'string' && Boolean(item.trim()));
      setAssetTypes(current => [...new Set([...current, ...inventoryTypes])].sort());
    }).catch(() => undefined);
    return () => { cancelled = true; };
  }, []);

  const onboardingDefaults = position.custom_attributes || position.customAttributes || {};
  const configuredAssetTypes = Array.isArray(onboardingDefaults.onboardingAssetTypes)
    ? onboardingDefaults.onboardingAssetTypes.filter((item): item is string => typeof item === 'string')
    : [];
  const configuredClientId = typeof onboardingDefaults.onboardingClientId === 'string' ? onboardingDefaults.onboardingClientId : null;
  const configuredClient = clients.find(client => client.id === configuredClientId);

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-background">
      <div className="border-b border-border/60 bg-muted/25 px-4 py-4 sm:px-6">
        <h3 className="text-sm font-semibold text-foreground">Position profile</h3>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          Core position attributes and recruiter assignment settings.
        </p>
      </div>
      <div className="px-4 py-4 sm:px-6 space-y-4">
        <PositionTextFieldRow
          displayValue={<div className="text-base font-bold text-foreground">{position.title}</div>}
          errorMessage={form.formState.errors.title?.message}
          form={form}
          isEditMode={isEditMode}
          label="Position Title *"
          name="title"
          placeholder="Enter position title"
        />
        <PositionTextFieldRow
          displayValue={<div className="text-base text-foreground">{position.department}</div>}
          errorMessage={form.formState.errors.department?.message}
          form={form}
          isEditMode={isEditMode}
          label="Department *"
          name="department"
          placeholder="Enter department"
        />
        <PositionLevelFieldRow
          form={form}
          isEditMode={isEditMode}
          isLoadingLevels={isLoadingLevels}
          position={position}
          positionLevels={positionLevels}
        />
        <PositionGradeFieldRow
          form={form}
          grades={grades}
          isEditMode={isEditMode}
          position={position}
        />
        <PositionRecruiterFieldRow
          availableRecruiters={availableRecruiters}
          form={form}
          isEditMode={isEditMode}
          position={position}
        />
        <PositionStatusFieldRow form={form} isEditMode={isEditMode} position={position} />
        <div className="border-t border-border/60 pt-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
            <ClockIcon className="h-4 w-4 text-primary" />
            Probation defaults
          </div>
          <p className="mb-3 text-xs leading-5 text-muted-foreground">
            New employees linked to this position inherit these values. HR can override the evaluation cadence for an individual employee.
          </p>
          <DetailsFieldRow fieldId="probationPeriodDays" label="Probation period">
            {isEditMode ? (
              <Controller
                name="probationPeriodDays"
                control={form.control}
                render={({ field }) => (
                  <div className="flex items-center gap-2">
                    <Input
                      {...field}
                      id="probationPeriodDays"
                      type="number"
                      min={1}
                      max={730}
                      className="max-w-32 bg-background"
                    />
                    <span className="text-sm text-muted-foreground">days</span>
                  </div>
                )}
              />
            ) : (
              <div className="text-base text-foreground">{position.probationPeriodDays || 90} days</div>
            )}
          </DetailsFieldRow>
          <DetailsFieldRow fieldId="probationEvaluationFrequencyDays" label="Evaluate every" isLast>
            {isEditMode ? (
              <Controller
                name="probationEvaluationFrequencyDays"
                control={form.control}
                render={({ field }) => (
                  <div className="flex items-center gap-2">
                    <Input
                      {...field}
                      id="probationEvaluationFrequencyDays"
                      type="number"
                      min={1}
                      max={365}
                      className="max-w-32 bg-background"
                    />
                    <span className="text-sm text-muted-foreground">days</span>
                  </div>
                )}
              />
            ) : (
              <div className="text-base text-foreground">
                Every {position.probationEvaluationFrequencyDays || 30} days
              </div>
            )}
          </DetailsFieldRow>
        </div>
        <div className="border-t border-border/60 pt-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <ComputerDesktopIcon className="h-4 w-4 text-primary" />
                Onboarding defaults
              </div>
              <p className="mt-1 max-w-xl text-xs leading-5 text-muted-foreground">
                Set the client and equipment types every new hire in this position needs. Individual inventory and serial numbers are assigned later.
              </p>
            </div>
            <Link href="/people/onboarding" className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
              Open onboarding <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="mt-4 space-y-4">
            <DetailsFieldRow fieldId="onboardingClientId" label="Default client">
              {isEditMode ? (
                <select
                  id="onboardingClientId"
                  value={selectedClientId || ''}
                  onChange={event => form.setValue('onboardingClientId', event.target.value || null, { shouldDirty: true })}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">No client assignment</option>
                  {clients.map(client => <option key={client.id} value={client.id}>{client.name}</option>)}
                </select>
              ) : <div className="text-base text-foreground">{configuredClient?.name || (configuredClientId ? 'Configured client' : 'No client assigned')}</div>}
            </DetailsFieldRow>
            <DetailsFieldRow fieldId="onboardingAssetTypes" label="Required asset types" isLast>
              {isEditMode ? (
                <div className="flex flex-wrap gap-2">
                  {assetTypes.map(assetType => {
                    const selected = selectedAssetTypes.includes(assetType);
                    return <button
                      key={assetType}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => form.setValue('onboardingAssetTypes', selected ? selectedAssetTypes.filter(item => item !== assetType) : [...selectedAssetTypes, assetType], { shouldDirty: true })}
                      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${selected ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground'}`}
                    >{assetType}</button>;
                  })}
                </div>
              ) : configuredAssetTypes.length ? (
                <div className="flex flex-wrap gap-2">{configuredAssetTypes.map(assetType => <span key={assetType} className="rounded-full bg-muted px-3 py-1.5 text-xs font-semibold text-foreground">{assetType}</span>)}</div>
              ) : <div className="text-sm text-muted-foreground">No asset types configured</div>}
            </DetailsFieldRow>
          </div>
        </div>
      </div>
    </div>
  );
}
