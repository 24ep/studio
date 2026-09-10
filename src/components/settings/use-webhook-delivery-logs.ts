'use client';

import { useCallback, useEffect, useState } from 'react';

import { useToast } from '@/hooks/use-toast';
import { getJsonErrorMessage, readJsonObject, readJsonOrFallback } from '@/lib/response-json';
import type {
  WebhookLogsFilterKey,
  WebhookLogsFiltersState,
  WebhookLog,
  WebhookLogsProps,
} from './webhook-delivery-logs-types';
import {
  buildWebhookDeliveryLogsQuery,
  DEFAULT_WEBHOOK_LOGS_FILTERS,
  DEFAULT_WEBHOOK_LOGS_PAGINATION,
  sanitizeWebhookDeliveryLogs,
} from './webhook-delivery-logs-utils';
import { getWebhookPaginationTotal } from './webhook-response-utils';

export function useWebhookDeliveryLogs({ webhookId, webhookName }: WebhookLogsProps) {
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [replayingLogId, setReplayingLogId] = useState<string | null>(null);
  const [pagination, setPagination] = useState(DEFAULT_WEBHOOK_LOGS_PAGINATION);
  const [filters, setFilters] = useState<WebhookLogsFiltersState>(DEFAULT_WEBHOOK_LOGS_FILTERS);
  const { error: showError, success: showSuccess } = useToast();

  const fetchLogs = useCallback(async () => {
    if (!webhookId) {
      setError('Webhook ID is required');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const params = buildWebhookDeliveryLogsQuery(pagination, filters);
      const response = await fetch(`/api/settings/webhooks/${webhookId}/logs?${params}`);

      if (response.ok) {
        const data = await readJsonOrFallback<unknown>(response, {});
        setLogs(sanitizeWebhookDeliveryLogs(data));
        setPagination(prev => ({
          ...prev,
          total: getWebhookPaginationTotal(data, 'total'),
          totalPages: getWebhookPaginationTotal(data, 'totalPages'),
        }));
      } else {
        const errorData = await readJsonObject(response);
        setError(getJsonErrorMessage(errorData, 'Failed to fetch webhook logs'));
        showError('Failed to fetch webhook logs');
      }
    } catch (fetchError) {
      const errorMessage = fetchError instanceof Error
        ? fetchError.message
        : 'Failed to fetch webhook logs';
      setError(errorMessage);
      showError('Failed to fetch webhook logs');
    } finally {
      setLoading(false);
    }
  }, [filters, pagination, showError, webhookId]);

  useEffect(() => {
    if (webhookId && webhookName) {
      fetchLogs();
    }
  }, [fetchLogs, webhookId, webhookName]);

  const replayLog = useCallback(async (logId: string) => {
    if (!webhookId || replayingLogId) return;

    try {
      setReplayingLogId(logId);
      const response = await fetch(
        `/api/settings/webhooks/${webhookId}/logs/${logId}/replay`,
        { method: 'POST' }
      );
      const data = await readJsonObject(response);

      if (!response.ok) {
        showError(getJsonErrorMessage(data, 'Webhook replay failed'));
        return;
      }

      showSuccess('Webhook delivery replayed successfully');
    } catch (replayError) {
      showError(replayError instanceof Error ? replayError.message : 'Webhook replay failed');
    } finally {
      setReplayingLogId(null);
      await fetchLogs();
    }
  }, [fetchLogs, replayingLogId, showError, showSuccess, webhookId]);

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleFilterChange = (key: WebhookLogsFilterKey, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const clearFilters = () => {
    setFilters(DEFAULT_WEBHOOK_LOGS_FILTERS);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  return {
    clearFilters,
    error,
    fetchLogs,
    filters,
    handleFilterChange,
    handlePageChange,
    loading,
    logs,
    pagination,
    replayLog,
    replayingLogId,
  };
}
