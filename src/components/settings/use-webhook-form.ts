'use client';

import { useCallback, useState, type FormEvent } from 'react';

import { getJsonErrorMessage, readJsonObject } from '@/lib/response-json';
import type { Webhook, WebhookFormData } from './webhook-management-data';
import {
  addCustomHeaderRow,
  buildWebhookSubmitPayload,
  createDefaultWebhookFormData,
  createWebhookFormDataFromWebhook,
  headerRecordToRows,
  removeCustomHeaderRow,
  updateCustomHeaderRow,
  type CustomHeaderRow,
} from './webhook-management-utils';

interface UseWebhookFormOptions {
  onError: (message: string) => void;
  onSuccess: (message: string) => void;
  onRefresh: () => void;
}

export function useWebhookForm({
  onError,
  onSuccess,
  onRefresh,
}: UseWebhookFormOptions) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<Webhook | null>(null);
  const [formData, setFormData] = useState<WebhookFormData>(createDefaultWebhookFormData);
  const [customHeaders, setCustomHeaders] = useState<CustomHeaderRow[]>([]);

  const resetForm = useCallback(() => {
    setFormData(createDefaultWebhookFormData());
    setCustomHeaders([]);
    setEditingWebhook(null);
  }, []);

  const handleSubmit = useCallback(async (e: FormEvent) => {
    e.preventDefault();

    try {
      const url = editingWebhook
        ? `/api/settings/webhooks/${editingWebhook.id}`
        : '/api/settings/webhooks';

      const method = editingWebhook ? 'PUT' : 'POST';
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildWebhookSubmitPayload(formData, customHeaders)),
      });

      if (response.ok) {
        onSuccess(editingWebhook ? 'Webhook updated successfully' : 'Webhook created successfully');
        setIsDialogOpen(false);
        resetForm();
        onRefresh();
      } else {
        onError(getJsonErrorMessage(await readJsonObject(response), 'Failed to save webhook'));
      }
    } catch (error) {
      onError('Failed to save webhook');
    }
  }, [customHeaders, editingWebhook, formData, onError, onRefresh, onSuccess, resetForm]);

  const handleEdit = useCallback((webhook: Webhook) => {
    setEditingWebhook(webhook);
    setFormData(createWebhookFormDataFromWebhook(webhook));
    setCustomHeaders(headerRecordToRows(webhook.headers));
    setIsDialogOpen(true);
  }, []);

  const handleDialogOpen = useCallback((open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      resetForm();
    }
  }, [resetForm]);

  const addCustomHeader = useCallback(() => {
    setCustomHeaders(addCustomHeaderRow);
  }, []);

  const removeCustomHeader = useCallback((index: number) => {
    setCustomHeaders(prev => removeCustomHeaderRow(prev, index));
  }, []);

  const updateCustomHeader = useCallback((index: number, field: 'key' | 'value', value: string) => {
    setCustomHeaders(prev => updateCustomHeaderRow(prev, index, field, value));
  }, []);

  return {
    isDialogOpen,
    editingWebhook,
    formData,
    customHeaders,
    setFormData,
    openCreateDialog: () => setIsDialogOpen(true),
    handleSubmit,
    handleEdit,
    handleDialogOpen,
    addCustomHeader,
    removeCustomHeader,
    updateCustomHeader,
  };
}
