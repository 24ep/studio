"use client";

import React from 'react';
import { Smartphone } from 'lucide-react';

import { ColorPicker } from '@/components/ui/color-picker';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

import type { PwaTabProps } from './pwa-tab-types';
import type { PwaColorFieldDefinition, PwaTextFieldDefinition } from './pwa-tab-utils';
import { PWA_COLOR_FIELDS, PWA_STATUS_BAR_OPTIONS, PWA_TEXT_FIELDS } from './pwa-tab-utils';
import { SystemSettingsFieldRow } from './SystemSettingsFieldRow';

type PwaTextStateKey = PwaTextFieldDefinition['stateKey'];
type PwaTextSetterKey = PwaTextFieldDefinition['setterKey'];
type PwaColorStateKey = PwaColorFieldDefinition['stateKey'];
type PwaColorSetterKey = PwaColorFieldDefinition['setterKey'];

type PwaSettingsProps = Omit<PwaTabProps, 'pwaEnabled' | 'setPwaEnabled'>;

export function PwaAccordionTitle(): React.ReactElement {
  return (
    <div className="flex items-center gap-2">
      <Smartphone className="h-5 w-5 text-primary" />
      <div className="text-left">
        <div className="font-semibold">Progressive Web App (PWA)</div>
        <div className="text-xs text-muted-foreground font-normal">
          Enable or disable Progressive Web App functionality. When enabled, users can install the app on mobile devices and tablets.
        </div>
      </div>
    </div>
  );
}

export function PwaEnabledSwitch({
  pwaEnabled,
  setPwaEnabled,
  isSaving
}: Pick<PwaTabProps, 'pwaEnabled' | 'setPwaEnabled' | 'isSaving'>): React.ReactElement {
  return (
    <SystemSettingsFieldRow
      htmlFor="pwa-enabled"
      label="Enable PWA"
      description="When enabled, users can install the app on mobile devices and tablets."
    >
      <Switch id="pwa-enabled" checked={pwaEnabled} onCheckedChange={setPwaEnabled} disabled={isSaving} />
    </SystemSettingsFieldRow>
  );
}

function PwaTextFieldControl({
  field,
  value,
  onChange,
  isSaving
}: {
  field: PwaTextFieldDefinition;
  value: string;
  onChange: (value: string) => void;
  isSaving: boolean;
}): React.ReactElement {
  return (
    <div className={field.className}>
      <Input
        id={field.id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={field.placeholder}
        disabled={isSaving}
        maxLength={field.maxLength}
      />
    </div>
  );
}

function PwaColorFieldControl({
  field,
  value,
  onChange,
  isSaving
}: {
  field: PwaColorFieldDefinition;
  value: string;
  onChange: (value: string) => void;
  isSaving: boolean;
}): React.ReactElement {
  return (
    <div className="flex gap-2">
      <ColorPicker value={value} onChange={onChange} disabled={isSaving} />
      <Input
        id={field.id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={field.placeholder}
        disabled={isSaving}
        className="flex-1"
      />
    </div>
  );
}

function PwaStatusBarField({
  pwaAppleMobileWebAppStatusBarStyle,
  setPwaAppleMobileWebAppStatusBarStyle,
  isSaving
}: Pick<
  PwaTabProps,
  'pwaAppleMobileWebAppStatusBarStyle' | 'setPwaAppleMobileWebAppStatusBarStyle' | 'isSaving'
>): React.ReactElement {
  return (
    <SystemSettingsFieldRow
      htmlFor="pwa-apple-status-bar"
      label="Apple Status Bar Style"
      description="iOS status bar appearance when the installed app is opened."
    >
      <Select
        value={pwaAppleMobileWebAppStatusBarStyle}
        onValueChange={setPwaAppleMobileWebAppStatusBarStyle}
        disabled={isSaving}
      >
        <SelectTrigger id="pwa-apple-status-bar">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {PWA_STATUS_BAR_OPTIONS.map(({ value, label }) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </SystemSettingsFieldRow>
  );
}

export function PwaMetadataFields(props: PwaSettingsProps): React.ReactElement {
  return (
    <>
      <Separator />
      <div className="space-y-4">
        <h4 className="text-sm font-semibold">PWA Metadata</h4>
        <div className="space-y-5">
          {PWA_TEXT_FIELDS.map((field) => (
            <SystemSettingsFieldRow
              key={field.id}
              htmlFor={field.id}
              label={field.label}
              description={field.description}
            >
              <PwaTextFieldControl
                field={field}
                value={props[field.stateKey as PwaTextStateKey]}
                onChange={props[field.setterKey as PwaTextSetterKey]}
                isSaving={props.isSaving}
              />
            </SystemSettingsFieldRow>
          ))}
          {PWA_COLOR_FIELDS.map((field) => (
            <SystemSettingsFieldRow
              key={field.id}
              htmlFor={field.id}
              label={field.label}
              description={field.description}
            >
              <PwaColorFieldControl
                field={field}
                value={props[field.stateKey as PwaColorStateKey]}
                onChange={props[field.setterKey as PwaColorSetterKey]}
                isSaving={props.isSaving}
              />
            </SystemSettingsFieldRow>
          ))}
          <PwaStatusBarField
            pwaAppleMobileWebAppStatusBarStyle={props.pwaAppleMobileWebAppStatusBarStyle}
            setPwaAppleMobileWebAppStatusBarStyle={props.setPwaAppleMobileWebAppStatusBarStyle}
            isSaving={props.isSaving}
          />
        </div>
      </div>
    </>
  );
}
