'use client';

import { Shield } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { WebhookFormData } from './webhook-management-data';
import type { WebhookFormSectionProps } from './WebhookFormDialogTypes';

const WEBHOOK_AUTH_OPTIONS: Array<{ value: WebhookFormData['auth_type']; label: string }> = [
  { value: 'none', label: 'No Authentication' },
  { value: 'basic', label: 'Basic Auth' },
  { value: 'bearer', label: 'Bearer Token' },
  { value: 'header', label: 'Custom Header' },
];

export function WebhookAuthenticationFields({
  formData,
  onUpdateFormData,
}: WebhookFormSectionProps) {
  return (
    <div className="space-y-4">
      <h4 className="flex items-center gap-2 text-sm font-semibold">
        <Shield className="h-4 w-4" />
        Authentication
      </h4>

      <Select
        value={formData.auth_type}
        onValueChange={value => onUpdateFormData({ auth_type: value as WebhookFormData['auth_type'] })}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select authentication type" />
        </SelectTrigger>
        <SelectContent>
          {WEBHOOK_AUTH_OPTIONS.map(option => (
            <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {formData.auth_type === 'basic' && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="auth-username" className="text-xs font-medium">Username</Label>
            <Input
              id="auth-username"
              type="text"
              placeholder="Username"
              value={formData.auth_username || ''}
              onChange={event => onUpdateFormData({ auth_username: event.target.value })}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="auth-password" className="text-xs font-medium">Password</Label>
            <Input
              id="auth-password"
              type="password"
              placeholder="Password"
              value={formData.auth_password || ''}
              onChange={event => onUpdateFormData({ auth_password: event.target.value })}
              className="mt-1"
            />
          </div>
        </div>
      )}

      {formData.auth_type === 'bearer' && (
        <div>
          <Label htmlFor="auth-token" className="text-xs font-medium">Bearer Token</Label>
          <Input
            id="auth-token"
            type="text"
            placeholder="Bearer token"
            value={formData.auth_token || ''}
            onChange={event => onUpdateFormData({ auth_token: event.target.value })}
            className="mt-1"
          />
        </div>
      )}

      {formData.auth_type === 'header' && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="auth-header-name" className="text-xs font-medium">Header Name</Label>
            <Input
              id="auth-header-name"
              type="text"
              placeholder="X-API-Key"
              value={formData.auth_header_name || ''}
              onChange={event => onUpdateFormData({ auth_header_name: event.target.value })}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="auth-header-value" className="text-xs font-medium">Header Value</Label>
            <Input
              id="auth-header-value"
              type="text"
              placeholder="Your API key"
              value={formData.auth_header_value || ''}
              onChange={event => onUpdateFormData({ auth_header_value: event.target.value })}
              className="mt-1"
            />
          </div>
        </div>
      )}
    </div>
  );
}

