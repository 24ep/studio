import { useEffect, useRef } from 'react';
import { useSharedSSE } from '@/hooks/use-shared-sse';

interface UsePositionDetailRealtimeRefreshProps {
  sessionStatus: string;
  positionId: string | null;
  isOpen: boolean;
  fetchPosition: () => void | Promise<void>;
  fetchHeadcountCount: () => void | Promise<void>;
  fetchAppliedApplicants: () => void | Promise<void>;
  fetchAllApplicants: () => void | Promise<void>;
  fetchPotentialApplicants: () => void | Promise<void>;
}

const REFRESH_EVENT_TYPES = new Set(['position_update', 'dashboard_update', 'Applicant_update']);

export function usePositionDetailRealtimeRefresh({
  sessionStatus,
  positionId,
  isOpen,
  fetchPosition,
  fetchHeadcountCount,
  fetchAppliedApplicants,
  fetchAllApplicants,
  fetchPotentialApplicants,
}: UsePositionDetailRealtimeRefreshProps) {
  const { subscribeToEvents } = useSharedSSE();
  const sessionStatusRef = useRef(sessionStatus);
  const positionIdRef = useRef(positionId);
  const isOpenRef = useRef(isOpen);
  const fetchPositionRef = useRef(fetchPosition);
  const fetchHeadcountCountRef = useRef(fetchHeadcountCount);
  const fetchAppliedApplicantsRef = useRef(fetchAppliedApplicants);
  const fetchAllApplicantsRef = useRef(fetchAllApplicants);
  const fetchPotentialApplicantsRef = useRef(fetchPotentialApplicants);

  useEffect(() => {
    sessionStatusRef.current = sessionStatus;
    positionIdRef.current = positionId;
    isOpenRef.current = isOpen;
    fetchPositionRef.current = fetchPosition;
    fetchHeadcountCountRef.current = fetchHeadcountCount;
    fetchAppliedApplicantsRef.current = fetchAppliedApplicants;
    fetchAllApplicantsRef.current = fetchAllApplicants;
    fetchPotentialApplicantsRef.current = fetchPotentialApplicants;
  }, [
    sessionStatus,
    positionId,
    isOpen,
    fetchPosition,
    fetchHeadcountCount,
    fetchAppliedApplicants,
    fetchAllApplicants,
    fetchPotentialApplicants,
  ]);

  useEffect(() => {
    let mounted = true;
    let refreshTimeout: NodeJS.Timeout | null = null;
    let lastUpdateTime = 0;
    const minUpdateInterval = 500;

    if (sessionStatusRef.current !== 'authenticated' || !positionIdRef.current || !isOpenRef.current) {
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
        if (
          !mounted ||
          sessionStatusRef.current !== 'authenticated' ||
          !positionIdRef.current ||
          !isOpenRef.current
        ) {
          return;
        }

        lastUpdateTime = Date.now();
        fetchPositionRef.current();
        fetchHeadcountCountRef.current();

        if (event.type === 'Applicant_update') {
          fetchAppliedApplicantsRef.current();
          fetchAllApplicantsRef.current();
          fetchPotentialApplicantsRef.current();
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
