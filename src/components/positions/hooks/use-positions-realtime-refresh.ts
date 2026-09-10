import { useEffect, useRef } from 'react';
import { useSharedSSE } from '@/hooks/use-shared-sse';

interface UsePositionsRealtimeRefreshProps {
  status: string;
  sessionUserId?: string | null;
  isTableLoading: boolean;
  isSearching: boolean;
  fetchPositions: (isSearch?: boolean, customPage?: number, signal?: AbortSignal) => Promise<void>;
  fetchRecruiterStats: () => Promise<void>;
}

const REFRESH_EVENT_TYPES = new Set(['position_update', 'dashboard_update', 'Applicant_update']);

export function usePositionsRealtimeRefresh({
  status,
  sessionUserId,
  isTableLoading,
  isSearching,
  fetchPositions,
  fetchRecruiterStats,
}: UsePositionsRealtimeRefreshProps) {
  const { subscribeToEvents } = useSharedSSE();
  const statusRef = useRef(status);
  const sessionUserIdRef = useRef(sessionUserId);
  const isTableLoadingRef = useRef(isTableLoading);
  const isSearchingRef = useRef(isSearching);
  const fetchPositionsRef = useRef(fetchPositions);
  const fetchRecruiterStatsRef = useRef(fetchRecruiterStats);

  useEffect(() => {
    statusRef.current = status;
    sessionUserIdRef.current = sessionUserId;
    isTableLoadingRef.current = isTableLoading;
    isSearchingRef.current = isSearching;
    fetchPositionsRef.current = fetchPositions;
    fetchRecruiterStatsRef.current = fetchRecruiterStats;
  }, [status, sessionUserId, isTableLoading, isSearching, fetchPositions, fetchRecruiterStats]);

  useEffect(() => {
    let mounted = true;
    let refreshTimeout: NodeJS.Timeout | null = null;
    let lastUpdateTime = 0;
    const minUpdateInterval = 500;

    if (statusRef.current !== 'authenticated' || !sessionUserIdRef.current) {
      return;
    }

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
        if (!mounted || statusRef.current !== 'authenticated' || !sessionUserIdRef.current) {
          return;
        }

        lastUpdateTime = Date.now();
        if (!isTableLoadingRef.current && !isSearchingRef.current) {
          fetchPositionsRef.current(false);
          fetchRecruiterStatsRef.current();
        }
      }, 500);
    });

    return () => {
      mounted = false;
      if (refreshTimeout) {
        clearTimeout(refreshTimeout);
      }
      unsubscribe();
    };
  }, [subscribeToEvents]);
}
