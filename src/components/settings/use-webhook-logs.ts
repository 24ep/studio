'use client';

import { useCallback, useState } from 'react';

import { sanitizeUrl } from '@/lib/security';
import { readJsonOrFallback } from '@/lib/response-json';

import type { Webhook } from './webhook-management-data';
import { buildWebhookLogsQuery } from './webhook-management-utils';
import { getWebhookResponseArray, getWebhookResponseNumber } from './webhook-response-utils';

type LogsFilter = 'all' | 'success' | 'failed';

export interface WebhookLog {
  id: string;
  createdAt: string;
  event_type: string;
  success: boolean;
  response_status?: string | number | null;
  duration_ms?: string | number | null;
}

interface UseWebhookLogsOptions {
  onError: (message: string) => void;
}

export function useWebhookLogs({ onError }: UseWebhookLogsOptions) {
  const [selectedWebhookForLogs, setSelectedWebhookForLogs] = useState<Webhook | null>(null);
  const [webhookLogs, setWebhookLogs] = useState<WebhookLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsFilter, setLogsFilter] = useState<LogsFilter>('all');
  const [logsSearch, setLogsSearch] = useState('');
  const [logsPage, setLogsPage] = useState(1);
  const [logsTotal, setLogsTotal] = useState(0);

  const fetchWebhookLogs = useCallback(async (
    webhookId: string,
    page: number = 1,
    filter: LogsFilter = 'all',
    search: string = ''
  ) => {
    try {
      setLogsLoading(true);
      const params = buildWebhookLogsQuery({ page, filter, search });

      const response = await fetch(`/api/settings/webhooks/${webhookId}/logs?${params}`);
      if (response.ok) {
        const data = await readJsonOrFallback<unknown>(response, {});
        setWebhookLogs(getWebhookResponseArray(data, 'logs') as unknown as WebhookLog[]);
        setLogsTotal(getWebhookResponseNumber(data, 'total'));
      } else {
        onError('Failed to fetch webhook logs');
      }
    } catch (error) {
      onError('Failed to fetch webhook logs');
    } finally {
      setLogsLoading(false);
    }
  }, [onError]);

  const handleLogsDialogOpen = useCallback((webhook: Webhook | null) => {
    setSelectedWebhookForLogs(webhook);
    if (webhook) {
      setLogsPage(1);
      setLogsFilter('all');
      setLogsSearch('');
      fetchWebhookLogs(webhook.id, 1, 'all', '');
    }
  }, [fetchWebhookLogs]);

  const handleLogsFilterChange = useCallback((filter: LogsFilter) => {
    setLogsFilter(filter);
    setLogsPage(1);
    if (selectedWebhookForLogs) {
      fetchWebhookLogs(selectedWebhookForLogs.id, 1, filter, logsSearch);
    }
  }, [fetchWebhookLogs, logsSearch, selectedWebhookForLogs]);

  const handleLogsSearch = useCallback((search: string) => {
    setLogsSearch(search);
    setLogsPage(1);
    if (selectedWebhookForLogs) {
      fetchWebhookLogs(selectedWebhookForLogs.id, 1, logsFilter, search);
    }
  }, [fetchWebhookLogs, logsFilter, selectedWebhookForLogs]);

  const handleLogsPageChange = useCallback((page: number) => {
    setLogsPage(page);
    if (selectedWebhookForLogs) {
      fetchWebhookLogs(selectedWebhookForLogs.id, page, logsFilter, logsSearch);
    }
  }, [fetchWebhookLogs, logsFilter, logsSearch, selectedWebhookForLogs]);

  const exportLogs = useCallback(async () => {
    if (!selectedWebhookForLogs) return;

    try {
      const params = buildWebhookLogsQuery({ filter: logsFilter, search: logsSearch });
      const response = await fetch(`/api/settings/webhooks/${selectedWebhookForLogs.id}/logs/export?${params}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const safeUrl = sanitizeUrl(url);

        if (safeUrl) {
          const a = document.createElement('a');
          a.href = safeUrl;
          a.download = `webhook-logs-${selectedWebhookForLogs.name}-${new Date().toISOString().split('T')[0]}.csv`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        }
      } else {
        onError('Failed to export logs');
      }
    } catch (error) {
      onError('Failed to export logs');
    }
  }, [logsFilter, logsSearch, onError, selectedWebhookForLogs]);

  return {
    selectedWebhookForLogs,
    webhookLogs,
    logsLoading,
    logsFilter,
    logsSearch,
    logsPage,
    logsTotal,
    handleLogsDialogOpen,
    handleLogsFilterChange,
    handleLogsSearch,
    handleLogsPageChange,
    exportLogs,
    closeLogsDialog: () => setSelectedWebhookForLogs(null),
  };
}
