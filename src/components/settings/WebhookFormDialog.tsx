'use client';

import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { WebhookEventSelectionPanel } from './WebhookEventSelectionPanel';
import { WebhookFormFieldsPanel } from './WebhookFormFieldsPanel';
import type { WebhookFormDialogProps } from './WebhookFormDialogTypes';

export function WebhookFormDialog({
  open,
  editingWebhook,
  formData,
  customHeaders,
  onOpenChange,
  onSubmit,
  onFormDataChange,
  onAddCustomHeader,
  onRemoveCustomHeader,
  onUpdateCustomHeader,
}: WebhookFormDialogProps) {
  const updateFormData = (patch: Partial<typeof formData>) => {
    onFormDataChange(prev => ({ ...prev, ...patch }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Webhook
        </Button>
      </DialogTrigger>
      <DialogContent className="flex max-h-[90vh] max-w-6xl flex-col overflow-hidden p-0">
        <DialogHeader className="flex-shrink-0 border-b px-6 py-4">
          <DialogTitle className="text-xl font-semibold">
            {editingWebhook ? 'Edit Webhook' : 'Create New Webhook'}
          </DialogTitle>
          <DialogDescription>
            Configure your webhook endpoint and select the events you want to receive notifications for.
          </DialogDescription>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          <WebhookEventSelectionPanel
            selectedEvents={formData.events}
            onUpdateFormData={updateFormData}
          />
          <WebhookFormFieldsPanel
            editingWebhook={editingWebhook}
            formData={formData}
            customHeaders={customHeaders}
            onSubmit={onSubmit}
            onOpenChange={onOpenChange}
            onUpdateFormData={updateFormData}
            onAddCustomHeader={onAddCustomHeader}
            onRemoveCustomHeader={onRemoveCustomHeader}
            onUpdateCustomHeader={onUpdateCustomHeader}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

