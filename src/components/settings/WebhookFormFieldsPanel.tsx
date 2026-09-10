'use client';

import type { FormEvent } from 'react';

import { Button } from '@/components/ui/button';
import type { Webhook, WebhookFormData } from './webhook-management-data';
import type { CustomHeaderRow } from './webhook-management-utils';
import { WebhookAuthenticationFields } from './WebhookAuthenticationFields';
import { WebhookCustomHeadersFields } from './WebhookCustomHeadersFields';
import {
  WebhookAdvancedSettingsFields,
  WebhookEndpointFields,
} from './WebhookEndpointFields';
import type { WebhookFormPatchHandler } from './WebhookFormDialogTypes';
import { WebhookRequestPreview } from './WebhookRequestPreview';

interface WebhookFormFieldsPanelProps {
  editingWebhook: Webhook | null;
  formData: WebhookFormData;
  customHeaders: CustomHeaderRow[];
  onSubmit: (event: FormEvent) => void;
  onOpenChange: (open: boolean) => void;
  onUpdateFormData: WebhookFormPatchHandler;
  onAddCustomHeader: () => void;
  onRemoveCustomHeader: (index: number) => void;
  onUpdateCustomHeader: (index: number, field: keyof CustomHeaderRow, value: string) => void;
}

export function WebhookFormFieldsPanel({
  editingWebhook,
  formData,
  customHeaders,
  onSubmit,
  onOpenChange,
  onUpdateFormData,
  onAddCustomHeader,
  onRemoveCustomHeader,
  onUpdateCustomHeader,
}: WebhookFormFieldsPanelProps) {
  return (
    <div className="flex min-h-0 w-full flex-col lg:w-3/5">
      <form onSubmit={onSubmit} className="flex h-full flex-col px-6 pb-6 pt-0">
        <div className="custom-scrollbar flex-1 space-y-6 overflow-y-auto pr-2" style={{ scrollbarWidth: 'thin' }}>
          <WebhookEndpointFields formData={formData} onUpdateFormData={onUpdateFormData} />
          <WebhookAdvancedSettingsFields formData={formData} onUpdateFormData={onUpdateFormData} />
          <WebhookAuthenticationFields formData={formData} onUpdateFormData={onUpdateFormData} />
          <WebhookCustomHeadersFields
            customHeaders={customHeaders}
            onAddCustomHeader={onAddCustomHeader}
            onRemoveCustomHeader={onRemoveCustomHeader}
            onUpdateCustomHeader={onUpdateCustomHeader}
          />
          <WebhookRequestPreview formData={formData} />
        </div>

        <div className="mt-6 flex flex-shrink-0 items-center justify-end gap-3 border-t pt-4">
          <Button type="submit">
            {editingWebhook ? 'Update Webhook' : 'Create Webhook'}
          </Button>
        </div>
      </form>
    </div>
  );
}
