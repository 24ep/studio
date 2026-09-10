"use client";

import { useEffect, useRef } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { useSharedSSE } from '@/hooks/use-shared-sse';

type UseDashboardRealtimeRefreshParams = {
  status: string;
  sessionUserId?: string | null;
  isLoading: boolean;
  fetchDataClientSide: () => void | Promise<void>;
  setHasSSEUpdated: Dispatch<SetStateAction<boolean>>;
};

const REFRESH_EVENT_TYPES = new Set(['Applicant_update', 'position_update', 'dashboard_update']);

function isDashboardRefreshEvent(eventType: string, data: unknown) {
  return eventType === 'dashboard_update'
    && typeof data === 'object'
    && data !== null
    && (data as { type?: unknown }).type === 'refresh';
}

export function useDashboardRealtimeRefresh({
  status,
  sessionUserId,
  isLoading,
  fetchDataClientSide,
  setHasSSEUpdated,
}: UseDashboardRealtimeRefreshParams) {
  const { subscribeToEvents } = useSharedSSE();
  const statusRef = useRef(status);
  const sessionUserIdRef = useRef(sessionUserId);
  const isLoadingRef = useRef(isLoading);
  const fetchDataClientSideRef = useRef(fetchDataClientSide);

  useEffect(() => {
    statusRef.current = status;
    sessionUserIdRef.current = sessionUserId;
    isLoadingRef.current = isLoading;
    fetchDataClientSideRef.current = fetchDataClientSide;
  }, [status, sessionUserId, isLoading, fetchDataClientSide]);

  useEffect(() => {
    let mounted = true;
    let refreshTimeout: NodeJS.Timeout | null = null;
    let lastUpdateTime = 0;
    const minUpdateInterval = 500;

    if (statusRef.current !== 'authenticated' || !sessionUserIdRef.current) {
      return;
    }

    const scheduleRefresh = (delayMs: number) => {
      setHasSSEUpdated(true);

      if (refreshTimeout) {
        clearTimeout(refreshTimeout);
      }

      refreshTimeout = setTimeout(() => {
        if (!mounted || statusRef.current !== 'authenticated' || !sessionUserIdRef.current) {
          return;
        }

        lastUpdateTime = Date.now();
        if (!isLoadingRef.current) {
          fetchDataClientSideRef.current();
        }
      }, delayMs);
    };

    const unsubscribe = subscribeToEvents((event) => {
      if (!mounted || !REFRESH_EVENT_TYPES.has(event.type)) {
        return;
      }

      if (isDashboardRefreshEvent(event.type, event.data)) {
        scheduleRefresh(500);
        return;
      }

      const now = Date.now();
      if (now - lastUpdateTime < minUpdateInterval) {
        return;
      }

      scheduleRefresh(1000);
    });

    return () => {
      mounted = false;
      if (refreshTimeout) {
        clearTimeout(refreshTimeout);
      }
      unsubscribe();
    };
  }, [setHasSSEUpdated, subscribeToEvents]);
}
