"use client";

import type React from 'react';
import { Mail } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

export interface SwitchRowProps {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled: boolean;
  muted?: boolean;
}

export interface EmailTextFieldProps {
  id: string;
  label: string;
  description: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
  type?: React.HTMLInputTypeAttribute;
}

export function EmailServiceSectionTitle(): React.ReactElement {
  return (
    <div className="flex items-center gap-2">
      <Mail className="h-5 w-5 text-primary" />
      <div className="text-left">
        <div className="font-semibold">Email Service</div>
        <div className="text-xs font-normal text-muted-foreground">
          Configure SMTP settings for sending email notifications and calendar invitations.
        </div>
      </div>
    </div>
  );
}

export function SwitchRow({
  id,
  label,
  description,
  checked,
  onCheckedChange,
  disabled,
  muted = false,
}: SwitchRowProps): React.ReactElement {
  return (
    <div className={`flex items-center justify-between rounded-lg border p-4 ${muted ? 'bg-muted/30' : ''}`}>
      <div className="space-y-1">
        <Label htmlFor={id} className="text-base font-medium">
          {label}
        </Label>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} />
    </div>
  );
}

export function EmailTextField({
  id,
  label,
  description,
  placeholder,
  value,
  onChange,
  disabled,
  type = 'text',
}: EmailTextFieldProps): React.ReactElement {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
      />
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  );
}
