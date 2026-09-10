'use client';

import { useCallback, useState } from 'react';

import { readJsonOrFallback } from '@/lib/response-json';
import { buildWebhookLogsQuery } from './webhook-management-utils';
import { getWebhookResponseArray, getWebhookResponseNumber } from './webhook-response-utils';

type GlobalLogsFilter = 'all' | 'success' | 'failed';

export interface GlobalWebhookLog {
  id: string;
  webhook_name?: string;
  webhook_url?: string;
  event_type: string;
  success: boolean;
  response_status?: string | number | null;
  response_message?: string | null;
  duration_ms?: string | number | null;
  created_at?: string;
  createdAt?: string;
}

interface UseWebhookGlobalLogsOptions {
  onError: (message: string) => void;
}

export function useWebhookGlobalLogs({ onError }: UseWebhookGlobalLogsOptions) {
  const [globalWebhookLogs, setGlobalWebhookLogs] = useState<GlobalWebhookLog[]>([]);
  const [globalLogsLoading, setGlobalLogsLoading] = useState(false);
  const [globalLogsFilter, setGlobalLogsFilter] = useState<GlobalLogsFilter>('all');
  const [globalLogsSearch, setGlobalLogsSearch] = useState('');
  const [globalLogsPage, setGlobalLogsPage] = useState(1);
  const [globalLogsTotal, setGlobalLogsTotal] = useState(0);

  const fetchGlobalWebhookLogs = useCallback(async (
    page: number = 1,
    filter: GlobalLogsFilter = 'all',
    search: string = ''
  ) => {
    try {
      setGlobalLogsLoading(true);
      const params = buildWebhookLogsQuery({ page, limit: 20, filter, search });
      const response = await fetch(`/api/settings/webhooks/logs?${params.toString()}`);
      if (response.ok) {
        const data = await readJsonOrFallback<unknown>(response, {});
        setGlobalWebhookLogs(getWebhookResponseArray(data, 'logs') as unknown as GlobalWebhookLog[]);
        setGlobalLogsTotal(getWebhookResponseNumber(data, 'total'));
      } else {
        onError('Failed to fetch webhook logs');
      }
    } catch (error) {
      onError('Failed to fetch webhook logs');
    } finally {
      setGlobalLogsLoading(false);
    }
  }, [onError]);

  const handleGlobalLogsFilterChange = useCallback((value: GlobalLogsFilter) => {
    setGlobalLogsFilter(value);
    setGlobalLogsPage(1);
    fetchGlobalWebhookLogs(1, value, globalLogsSearch);
  }, [fetchGlobalWebhookLogs, globalLogsSearch]);

  const handleGlobalLogsSearch = useCallback((value: string) => {
    setGlobalLogsSearch(value);
    setGlobalLogsPage(1);
    fetchGlobalWebhookLogs(1, globalLogsFilter, value);
  }, [fetchGlobalWebhookLogs, globalLogsFilter]);

  const handleGlobalLogsPageChange = useCallback((nextPage: number) => {
    setGlobalLogsPage(nextPage);
    fetchGlobalWebhookLogs(nextPage, globalLogsFilter, globalLogsSearch);
  }, [fetchGlobalWebhookLogs, globalLogsFilter, globalLogsSearch]);

  return {
    globalWebhookLogs,
    globalLogsLoading,
    globalLogsFilter,
    globalLogsSearch,
    globalLogsPage,
    globalLogsTotal,
    fetchGlobalWebhookLogs,
    handleGlobalLogsFilterChange,
    handleGlobalLogsSearch,
    handleGlobalLogsPageChange,
  };
}
