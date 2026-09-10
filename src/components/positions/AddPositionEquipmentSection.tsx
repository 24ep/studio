"use client";

import * as React from 'react';
import { Building2, Check, Monitor, PackageCheck } from 'lucide-react';

import type { AddPositionBasicInfoSectionProps } from './AddPositionModalSectionTypes';

const DEFAULT_ASSET_TYPES = ['Access card', 'Headset', 'Laptop', 'Monitor', 'Phone'];

export function AddPositionEquipmentSection({
  form,
  isSaving,
}: Pick<AddPositionBasicInfoSectionProps, 'form' | 'isSaving'>) {
  const [clients, setClients] = React.useState<Array<{ id: string; name: string }>>([]);
  const [assetTypes, setAssetTypes] = React.useState<string[]>(DEFAULT_ASSET_TYPES);
  const selectedAssetTypes = form.watch('onboardingAssetTypes') || [];

  React.useEffect(() => {
    let cancelled = false;

    Promise.all([
      fetch('/api/hr/clients?pageSize=100', { credentials: 'include', cache: 'no-store' }),
      fetch('/api/hr/v1/assets?pageSize=100', { credentials: 'include', cache: 'no-store' }),
    ])
      .then(async ([clientResponse, assetResponse]) => {
        const clientPayload = clientResponse.ok ? await clientResponse.json() : {};
        const assetPayload = assetResponse.ok ? await assetResponse.json() : {};
        if (cancelled) return;

        const clientRows = clientPayload?.resource?.records
          || clientPayload?.records
          || clientPayload?.data
          || [];
        setClients(Array.isArray(clientRows)
          ? clientRows.filter((item: unknown): item is { id: string; name: string } => (
              Boolean(item)
              && typeof item === 'object'
              && typeof (item as { id?: unknown }).id === 'string'
              && typeof (item as { name?: unknown }).name === 'string'
            ))
          : []);

        const inventoryTypes = (Array.isArray(assetPayload?.data) ? assetPayload.data : [])
          .map((item: Record<string, unknown>) => item.assetType)
          .filter((item: unknown): item is string => typeof item === 'string' && Boolean(item.trim()));
        setAssetTypes([...new Set([...DEFAULT_ASSET_TYPES, ...inventoryTypes])].sort());
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section aria-labelledby="position-equipment-heading" className="space-y-7">
      <div className="flex items-start gap-3 border-b border-border pb-5">
        <PackageCheck className="mt-0.5 h-5 w-5 text-primary" />
        <div>
          <h3 id="position-equipment-heading" className="text-base font-semibold">Equipment &amp; onboarding</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Prepare the client assignment and day-one equipment for this role. This step is optional.
          </p>
        </div>
      </div>

      <div className="grid gap-7 md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" />
            <label htmlFor="position-default-client" className="text-sm font-semibold">Default client</label>
          </div>
          <p className="text-xs leading-5 text-muted-foreground">
            Assign the client or business account this new hire will support.
          </p>
          <select
            id="position-default-client"
            value={form.watch('onboardingClientId') || ''}
            onChange={(event) => form.setValue('onboardingClientId', event.target.value || null, { shouldDirty: true })}
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
            disabled={isSaving}
          >
            <option value="">No client assignment</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>{client.name}</option>
            ))}
          </select>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Monitor className="h-4 w-4 text-primary" />
            <h4 className="text-sm font-semibold">Required equipment</h4>
          </div>
          <p className="text-xs leading-5 text-muted-foreground">
            Select everything that should be ready before the employee's first day.
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {assetTypes.map((assetType) => {
              const selected = selectedAssetTypes.includes(assetType);
              return (
                <button
                  key={assetType}
                  type="button"
                  aria-pressed={selected}
                  disabled={isSaving}
                  onClick={() => form.setValue(
                    'onboardingAssetTypes',
                    selected
                      ? selectedAssetTypes.filter((item) => item !== assetType)
                      : [...selectedAssetTypes, assetType],
                    { shouldDirty: true },
                  )}
                  className={`flex h-11 items-center justify-between rounded-md border px-3 text-left text-sm transition-colors ${selected
                    ? 'border-primary bg-primary/10 text-foreground'
                    : 'border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground'}`}
                >
                  <span>{assetType}</span>
                  <span className={`flex h-5 w-5 items-center justify-center rounded-full border ${selected
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border'}`}
                  >
                    {selected && <Check className="h-3 w-3" />}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <p className="border-t border-border pt-4 text-xs text-muted-foreground">
        You can leave this step empty and configure onboarding later from the position details page.
      </p>
    </section>
  );
}
