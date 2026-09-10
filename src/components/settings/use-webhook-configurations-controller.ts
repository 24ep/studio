'use client';

import { useCallback, useMemo, useState } from 'react';
import type { Webhook } from './webhook-management-data';
import {
  deleteWebhookConfiguration,
  fetchWebhookConfigurations,
  fetchWebhookExportBlob,
  updateWebhookBodyConfiguration,
} from './webhook-management-api';
import { performWebhookBulkActionRequest } from './webhook-management-bulk-actions';
import { downloadWebhookExportBlob } from './webhook-management-export';
import {
  areAllWebhooksSelected,
  filterWebhooks,
  getSelectedWebhookCount,
  isWebhookSelected,
  type WebhookStatusFilter,
} from './webhook-management-utils';

interface UseWebhookConfigurationsControllerOptions {
  onError: (message: string) => void;
  onSuccess: (message: string) => void;
}

export function useWebhookConfigurationsController({
  onError,
  onSuccess,
}: UseWebhookConfigurationsControllerOptions) {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedWebhooks, setSelectedWebhooks] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState('');
  const [bulkLoading, setBulkLoading] = useState(false);
  const [customizingWebhook, setCustomizingWebhook] = useState<Webhook | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<WebhookStatusFilter>('all');

  const fetchWebhooks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchWebhookConfigurations();
      if (result.ok) {
        setWebhooks(result.webhooks);
      } else {
        setError(result.errorMessage);
        onError(result.errorMessage);
        setWebhooks([]);
      }
    } catch (error) {
      console.error('Error fetching webhooks:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch webhooks';
      setError(errorMessage);
      onError('Failed to fetch webhooks');
      setWebhooks([]);
    } finally {
      setLoading(false);
    }
  }, [onError]);

  const filteredWebhooks = useMemo(
    () => filterWebhooks(webhooks, statusFilter, searchTerm),
    [webhooks, statusFilter, searchTerm],
  );

  const selectedWebhookCount = getSelectedWebhookCount(selectedWebhooks);
  const allWebhooksSelected = areAllWebhooksSelected(selectedWebhooks, webhooks);
  const isSelected = (webhookId: string) => isWebhookSelected(selectedWebhooks, webhookId);

  const handleDelete = async (id: string) => {
    try {
      if (await deleteWebhookConfiguration(id)) {
        onSuccess('Webhook deleted successfully');
        fetchWebhooks();
      } else {
        onError('Failed to delete webhook');
      }
    } catch {
      onError('Failed to delete webhook');
    }
  };

  const handleWebhookSelection = (webhookId: string, selected: boolean) => {
    setSelectedWebhooks((previousSelection) => {
      const nextSelection = new Set(previousSelection);
      if (selected) {
        nextSelection.add(webhookId);
      } else {
        nextSelection.delete(webhookId);
      }
      return nextSelection;
    });
  };

  const handleBodyConfigSave = async (webhookId: string, config: unknown) => {
    try {
      const result = await updateWebhookBodyConfiguration({ webhookId, config });

      if (result.ok) {
        onSuccess('Webhook body configuration updated successfully');
        fetchWebhooks();
      } else {
        onError(result.errorMessage);
      }
    } catch {
      onError('Failed to update webhook body configuration');
    }
  };

  const handleSelectAll = () => {
    setSelectedWebhooks(
      allWebhooksSelected
        ? new Set()
        : new Set(webhooks.map((webhook) => webhook.id)),
    );
  };

  const resetBulkState = () => {
    setSelectedWebhooks(new Set());
    setBulkAction('');
  };

  const performBulkAction = async () => {
    if (!bulkAction || selectedWebhooks.size === 0) {
      return;
    }

    try {
      setBulkLoading(true);
      const webhookIds = Array.from(selectedWebhooks);
      const result = await performWebhookBulkActionRequest({
        action: bulkAction,
        selectedCount: selectedWebhooks.size,
        webhookIds,
      });

      if (!result.ok) {
        onError(result.message);
        return;
      }

      onSuccess(result.message);
      resetBulkState();
      fetchWebhooks();
    } catch {
      onError('Failed to perform bulk action');
    } finally {
      setBulkLoading(false);
    }
  };

  const exportWebhooks = async () => {
    try {
      const blob = await fetchWebhookExportBlob();
      if (!blob) {
        onError('Failed to export webhooks');
        return;
      }

      if (!downloadWebhookExportBlob(blob)) {
        onError('Failed to export webhooks');
      }
    } catch {
      onError('Failed to export webhooks');
    }
  };

  return {
    allWebhooksSelected,
    bulkAction,
    bulkLoading,
    customizingWebhook,
    error,
    exportWebhooks,
    fetchWebhooks,
    filteredWebhooks,
    handleBodyConfigSave,
    handleDelete,
    handleSelectAll,
    handleWebhookSelection,
    isSelected,
    loading,
    performBulkAction,
    searchTerm,
    selectedWebhookCount,
    selectedWebhooks,
    setBulkAction,
    setCustomizingWebhook,
    setSearchTerm,
    setSelectedWebhooks,
    setStatusFilter,
    setViewMode,
    statusFilter,
    viewMode,
    webhooks,
  };
}
