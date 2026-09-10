import type { ReactNode } from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';

interface ApplicantSettingsOptionCardProps {
  children: ReactNode;
  description: string;
  title: string;
}

export function ApplicantSettingsOptionCard({
  children,
  description,
  title,
}: ApplicantSettingsOptionCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export function ApplicantSettingsSwitchRow({
  checked,
  description,
  id,
  label,
  onCheckedChange,
}: {
  checked: boolean;
  description?: string;
  id: string;
  label: string;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className={description ? 'space-y-0.5' : undefined}>
        <Label htmlFor={id} className="text-sm font-medium">
          {label}
        </Label>
        {description && (
          <div className="text-xs text-muted-foreground">{description}</div>
        )}
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

export function ApplicantSettingsRadioOption({
  description,
  id,
  label,
  value,
}: {
  description?: string;
  id: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center space-x-2">
      <RadioGroupItem value={value} id={id} />
      <Label htmlFor={id} className="text-sm font-medium">
        {label}
      </Label>
      {description && (
        <div className="text-xs text-muted-foreground ml-2">{description}</div>
      )}
    </div>
  );
}
