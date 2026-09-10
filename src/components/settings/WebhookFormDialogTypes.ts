import type { Dispatch, FormEvent, SetStateAction } from 'react';

import type { Webhook, WebhookFormData } from './webhook-management-data';
import type { CustomHeaderRow } from './webhook-management-utils';

export interface WebhookFormDialogProps {
  open: boolean;
  editingWebhook: Webhook | null;
  formData: WebhookFormData;
  customHeaders: CustomHeaderRow[];
  onOpenChange: (open: boolean) => void;
  onSubmit: (event: FormEvent) => void;
  onFormDataChange: Dispatch<SetStateAction<WebhookFormData>>;
  onAddCustomHeader: () => void;
  onRemoveCustomHeader: (index: number) => void;
  onUpdateCustomHeader: (index: number, field: keyof CustomHeaderRow, value: string) => void;
}

export type WebhookFormPatchHandler = (patch: Partial<WebhookFormData>) => void;

export interface WebhookFormSectionProps {
  formData: WebhookFormData;
  onUpdateFormData: WebhookFormPatchHandler;
}

