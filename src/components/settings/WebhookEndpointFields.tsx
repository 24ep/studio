'use client';

import { Settings } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import type { WebhookFormData } from './webhook-management-data';
import type { WebhookFormSectionProps } from './WebhookFormDialogTypes';

const WEBHOOK_METHODS: WebhookFormData['method'][] = ['POST', 'GET', 'PUT', 'PATCH'];

export function WebhookEndpointFields({
  formData,
  onUpdateFormData,
}: WebhookFormSectionProps) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="webhook-name" className="text-sm font-semibold">Webhook Name</Label>
        <Input
          id="webhook-name"
          type="text"
          placeholder="e.g., Applicant Notifications"
          value={formData.name}
          onChange={event => onUpdateFormData({ name: event.target.value })}
          required
          className="mt-1"
        />
      </div>

      <div>
        <Label className="text-sm font-semibold">Endpoint URL</Label>
        <div className="mt-1 flex items-center gap-2">
          <Select
            value={formData.method}
            onValueChange={value => onUpdateFormData({ method: value as WebhookFormData['method'] })}
          >
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {WEBHOOK_METHODS.map(method => (
                <SelectItem key={method} value={method}>{method}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="url"
            placeholder="https://your-endpoint.com/webhook"
            value={formData.url}
            onChange={event => onUpdateFormData({ url: event.target.value })}
            required
            className="flex-1 font-mono text-sm"
          />
        </div>
      </div>

      <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3 dark:bg-slate-800">
        <div>
          <Label className="text-sm font-semibold">Webhook Status</Label>
          <p className="text-xs text-muted-foreground">Enable or disable this webhook</p>
        </div>
        <Switch
          checked={formData.is_active}
          onCheckedChange={checked => onUpdateFormData({ is_active: checked })}
        />
      </div>
    </div>
  );
}

export function WebhookAdvancedSettingsFields({
  formData,
  onUpdateFormData,
}: WebhookFormSectionProps) {
  return (
    <div className="space-y-4">
      <h4 className="flex items-center gap-2 text-sm font-semibold">
        <Settings className="h-4 w-4" />
        Advanced Settings
      </h4>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="timeout" className="text-xs font-medium">Timeout (seconds)</Label>
          <Input
            id="timeout"
            type="number"
            min={5}
            max={300}
            value={formData.timeout}
            onChange={event => onUpdateFormData({ timeout: Number(event.target.value) })}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="retry-count" className="text-xs font-medium">Retry Attempts</Label>
          <Input
            id="retry-count"
            type="number"
            min={0}
            max={10}
            value={formData.retry_count}
            onChange={event => onUpdateFormData({ retry_count: Number(event.target.value) })}
            className="mt-1"
          />
        </div>
      </div>
    </div>
  );
}

