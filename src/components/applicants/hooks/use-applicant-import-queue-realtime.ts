"use client";

import { useEffect, useRef } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { toast } from 'react-hot-toast';
import { useSharedSSE } from '@/hooks/use-shared-sse';
import { getUploadQueueSummaryToastMessage } from '../applicant-import-queue-utils';
import type { QueueItem, QueueResponse, QueueSummary } from '../applicant-import-queue-types';
import { useVisibilityInterval } from '@/hooks/use-visibility-interval';

type FetchQueue = (currentPage?: number, currentPageSize?: number) => Promise<void>;

interface UseApplicantImportQueueRealtimeParams {
  loading: boolean;
  page: number;
  pageSize: number;
  fetchQueue: FetchQueue;
  setQueueData: Dispatch<SetStateAction<QueueResponse | null>>;
  setLastUpdate: Dispatch<SetStateAction<Date | null>>;
}

interface QueueEventData {
  data?: unknown;
  total?: number;
  summary?: QueueSummary;
}

const REFRESH_EVENT_TYPES = new Set(['upload_queue_update', 'queue']);

function getQueueEventData(data: unknown): QueueEventData {
  return data && typeof data === 'object' ? data as QueueEventData : {};
}

function showSummaryToast(summary?: QueueSummary) {
  const summaryMessage = getUploadQueueSummaryToastMessage(summary);
  if (!summaryMessage) {
    return;
  }

  toast.success(summaryMessage, {
    duration: 2000,
    position: 'top-right',
    style: {
      background: '#10b981',
      color: 'white',
      fontSize: '12px',
    },
  });
}

export function useApplicantImportQueueRealtime({
  loading,
  page,
  pageSize,
  fetchQueue,
  setQueueData,
  setLastUpdate,
}: UseApplicantImportQueueRealtimeParams) {
  const { isConnected: realtimeConnected, subscribeToEvents } = useSharedSSE();
  const loadingRef = useRef(loading);
  const pageRef = useRef(page);
  const pageSizeRef = useRef(pageSize);
  const fetchQueueRef = useRef(fetchQueue);

  useEffect(() => {
    loadingRef.current = loading;
    pageRef.current = page;
    pageSizeRef.current = pageSize;
    fetchQueueRef.current = fetchQueue;
  }, [fetchQueue, loading, page, pageSize]);

  useEffect(() => {
    let mounted = true;
    let refreshTimeout: NodeJS.Timeout | null = null;
    let lastUpdateTime = 0;
    const minUpdateInterval = 500;

    const unsubscribe = subscribeToEvents((event) => {
      if (!mounted || !REFRESH_EVENT_TYPES.has(event.type)) {
        return;
      }

      const now = Date.now();
      if (now - lastUpdateTime < minUpdateInterval) {
        return;
      }

      if (refreshTimeout) {
        clearTimeout(refreshTimeout);
      }

      refreshTimeout = setTimeout(() => {
        if (!mounted) {
          return;
        }

        lastUpdateTime = Date.now();
        const eventData = getQueueEventData(event.data);

        if (Array.isArray(eventData.data)) {
          setQueueData({
            data: eventData.data as QueueItem[],
            total: eventData.total || 0,
            summary: eventData.summary || { queued: 0, inprocess: 0, success: 0, error: 0 },
          });
          setLastUpdate(new Date());
          showSummaryToast(eventData.summary);
          return;
        }

        if (!loadingRef.current) {
          fetchQueueRef.current(pageRef.current, pageSizeRef.current);
          setLastUpdate(new Date());
          showSummaryToast(eventData.summary);
        }
      }, 200);
    });

    return () => {
      mounted = false;
      if (refreshTimeout) {
        clearTimeout(refreshTimeout);
      }
      unsubscribe();
    };
  }, [setLastUpdate, setQueueData, subscribeToEvents]);

  useEffect(() => {
    const handleRefreshEvent = () => {
      fetchQueueRef.current(pageRef.current, pageSizeRef.current);
      setLastUpdate(new Date());
    };

    window.addEventListener('refreshApplicantQueue', handleRefreshEvent);

    return () => {
      window.removeEventListener('refreshApplicantQueue', handleRefreshEvent);
    };
  }, [setLastUpdate]);

  useVisibilityInterval(() => {
    if (realtimeConnected) return;
    fetchQueueRef.current(pageRef.current, pageSizeRef.current);
    setLastUpdate(new Date());
  }, 15000, !realtimeConnected);
}
