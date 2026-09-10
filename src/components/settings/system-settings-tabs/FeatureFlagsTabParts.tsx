"use client";

import React from 'react';

import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

export interface FeatureFlagSetting {
  id: string;
  title: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled: boolean;
}

interface FeatureFlagSettingListProps {
  settings: FeatureFlagSetting[];
}

export function FeatureFlagSettingList({
  settings
}: FeatureFlagSettingListProps): React.ReactElement {
  return (
    <div className="space-y-4">
      {settings.map((setting) => (
        <FeatureFlagSettingRow key={setting.id} setting={setting} />
      ))}
    </div>
  );
}

interface FeatureFlagSettingRowProps {
  setting: FeatureFlagSetting;
}

function FeatureFlagSettingRow({
  setting
}: FeatureFlagSettingRowProps): React.ReactElement {
  return (
    <div className="flex items-center justify-between">
      <div className="space-y-0.5">
        <Label htmlFor={setting.id}>{setting.title}</Label>
        <p className="text-sm text-muted-foreground">
          {setting.description}
        </p>
      </div>
      <Switch
        id={setting.id}
        checked={setting.checked}
        onCheckedChange={setting.onCheckedChange}
        disabled={setting.disabled}
      />
    </div>
  );
}
