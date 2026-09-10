"use client";

import type React from 'react';
import { Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import type {
  OrganizationAttributeType,
  OrganizationCustomAttribute,
} from '@/lib/organization-profile';
import { SystemSettingsFieldRow } from './SystemSettingsFieldRow';

export function ProfileInput({
  description,
  disabled,
  id,
  label,
  onChange,
  placeholder,
  type = 'text',
  value,
}: {
  description: string;
  disabled: boolean;
  id: string;
  label: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: React.HTMLInputTypeAttribute;
  value: string;
}) {
  return (
    <SystemSettingsFieldRow htmlFor={id} label={label} description={description}>
      <Input
        id={id}
        type={type}
        value={value}
        onChange={event => onChange(event.target.value)}
        placeholder={placeholder}
        disabled={disabled}
      />
    </SystemSettingsFieldRow>
  );
}

export function ProfileSelect({
  description,
  disabled,
  id,
  label,
  onChange,
  options,
  value,
}: {
  description: string;
  disabled: boolean;
  id: string;
  label: string;
  onChange: (value: string) => void;
  options: string[];
  value: string;
}) {
  return (
    <SystemSettingsFieldRow htmlFor={id} label={label} description={description}>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger id={id}><SelectValue placeholder={`Select ${label.toLowerCase()}`} /></SelectTrigger>
        <SelectContent>
          {options.map(option => <SelectItem key={option} value={option}>{option}</SelectItem>)}
        </SelectContent>
      </Select>
    </SystemSettingsFieldRow>
  );
}

export function CustomAttributeRow({
  attribute,
  disabled,
  onChange,
  onRemove,
}: {
  attribute: OrganizationCustomAttribute;
  disabled: boolean;
  onChange: (attribute: OrganizationCustomAttribute) => void;
  onRemove: () => void;
}) {
  const update = <Key extends keyof OrganizationCustomAttribute>(
    key: Key,
    value: OrganizationCustomAttribute[Key],
  ) => onChange({ ...attribute, [key]: value });

  return (
    <div className="grid gap-2 border p-3 sm:grid-cols-[minmax(150px,0.8fr)_150px_minmax(180px,1fr)_36px] sm:items-center">
      <Input
        value={attribute.label}
        onChange={event => update('label', event.target.value)}
        aria-label="Attribute label"
        disabled={disabled}
      />
      <Select
        value={attribute.type}
        onValueChange={value => {
          onChange({
            ...attribute,
            type: value as OrganizationAttributeType,
            value: value === 'boolean' ? 'false' : attribute.value,
          });
        }}
        disabled={disabled}
      >
        <SelectTrigger aria-label="Attribute type"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="text">Text</SelectItem>
          <SelectItem value="number">Number</SelectItem>
          <SelectItem value="date">Date</SelectItem>
          <SelectItem value="email">Email</SelectItem>
          <SelectItem value="phone">Phone</SelectItem>
          <SelectItem value="url">URL</SelectItem>
          <SelectItem value="boolean">Yes / No</SelectItem>
        </SelectContent>
      </Select>
      {attribute.type === 'boolean' ? (
        <div className="flex h-9 items-center gap-2">
          <Switch
            checked={attribute.value === 'true'}
            onCheckedChange={checked => update('value', String(checked))}
            disabled={disabled}
          />
          <span className="text-xs text-muted-foreground">{attribute.value === 'true' ? 'Yes' : 'No'}</span>
        </div>
      ) : (
        <Input
          type={getAttributeInputType(attribute.type)}
          value={attribute.value}
          onChange={event => update('value', event.target.value)}
          aria-label={`${attribute.label} value`}
          disabled={disabled}
        />
      )}
      <Button
        type="button"
        size="icon"
        variant="ghost"
        onClick={onRemove}
        aria-label={`Remove ${attribute.label}`}
        disabled={disabled}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

function getAttributeInputType(type: OrganizationAttributeType): React.HTMLInputTypeAttribute {
  if (type === 'phone') return 'tel';
  return type;
}
