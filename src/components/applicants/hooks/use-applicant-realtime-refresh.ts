import { useEffect, useRef } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { Applicant, ApplicantFilterValues } from '@/lib/types';
import { useSharedSSE } from '@/hooks/use-shared-sse';
import {
  getApplicantEventAction,
  getApplicantUpdate,
  getDeletedApplicantId,
  removeApplicantById,
  replaceApplicantById,
  shouldHandleApplicantRealtimeRefreshEvent,
  shouldRunApplicantRealtimeRefresh,
} from './applicant-realtime-refresh-utils';

interface UseApplicantRealtimeRefreshProps {
  sessionStatus: string;
  sessionUserId?: string;
  isLoading: boolean;
  filters: ApplicantFilterValues;
  page: number;
  pageSize: number;
  fetchTableData: (filters: ApplicantFilterValues, page: number, pageSize: number) => void | Promise<void>;
  fetchAllApplicantsForCounts: () => void | Promise<void>;
  forceRefreshFitScoreCounts: () => void | Promise<void>;
  setFilteredApplicants: Dispatch<SetStateAction<Applicant[]>>;
  setAllApplicantsForCounts: Dispatch<SetStateAction<Applicant[]>>;
  setTotal: Dispatch<SetStateAction<number>>;
}

export function useApplicantRealtimeRefresh({
  sessionStatus,
  sessionUserId,
  isLoading,
  filters,
  page,
  pageSize,
  fetchTableData,
  fetchAllApplicantsForCounts,
  forceRefreshFitScoreCounts,
  setFilteredApplicants,
  setAllApplicantsForCounts,
  setTotal,
}: UseApplicantRealtimeRefreshProps) {
  const { isConnected, subscribeToEvents } = useSharedSSE();
  const statusRef = useRef(sessionStatus);
  const sessionUserIdRef = useRef(sessionUserId);
  const isLoadingRef = useRef(isLoading);
  const filtersRef = useRef(filters);
  const pageRef = useRef(page);
  const pageSizeRef = useRef(pageSize);
  const fetchTableDataRef = useRef(fetchTableData);
  const fetchAllApplicantsForCountsRef = useRef(fetchAllApplicantsForCounts);
  const forceRefreshFitScoreCountsRef = useRef(forceRefreshFitScoreCounts);

  useEffect(() => {
    statusRef.current = sessionStatus;
    sessionUserIdRef.current = sessionUserId;
    isLoadingRef.current = isLoading;
    filtersRef.current = filters;
    pageRef.current = page;
    pageSizeRef.current = pageSize;
    fetchTableDataRef.current = fetchTableData;
    fetchAllApplicantsForCountsRef.current = fetchAllApplicantsForCounts;
    forceRefreshFitScoreCountsRef.current = forceRefreshFitScoreCounts;
  }, [
    sessionStatus,
    sessionUserId,
    isLoading,
    filters,
    page,
    pageSize,
    fetchTableData,
    fetchAllApplicantsForCounts,
    forceRefreshFitScoreCounts,
  ]);

  useEffect(() => {
    let mounted = true;
    let refreshTimeout: NodeJS.Timeout | null = null;
    let lastUpdateTime = 0;
    const minUpdateInterval = 1000;

    if (statusRef.current !== 'authenticated' || !sessionUserIdRef.current) {
      return;
    }

    const unsubscribe = subscribeToEvents((event) => {
      if (!mounted) return;

      if (!shouldHandleApplicantRealtimeRefreshEvent(event.type)) {
        return;
      }

      const action = getApplicantEventAction(event.data);
      if (event.type === 'Applicant_update' && action === 'deleted') {
        const deletedApplicantId = getDeletedApplicantId(event.data);
        if (typeof deletedApplicantId === 'string') {
          setFilteredApplicants(prev => removeApplicantById(prev, deletedApplicantId));
          setAllApplicantsForCounts(prev => removeApplicantById(prev, deletedApplicantId));
          setTotal(prev => Math.max(0, prev - 1));
        }
        return;
      }

      if (event.type === 'Applicant_update' && !action) {
        const updatedApplicant = getApplicantUpdate(event.data);
        if (updatedApplicant) {
          setFilteredApplicants(prev => replaceApplicantById(prev, updatedApplicant));
          setAllApplicantsForCounts(prev => replaceApplicantById(prev, updatedApplicant));
        }
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
        if (!shouldRunApplicantRealtimeRefresh({
          isLoading: isLoadingRef.current,
          mounted,
          sessionStatus: statusRef.current,
          sessionUserId: sessionUserIdRef.current,
        })) {
          return;
        }

        lastUpdateTime = Date.now();
        fetchTableDataRef.current(filtersRef.current, pageRef.current, pageSizeRef.current);
        fetchAllApplicantsForCountsRef.current();
        forceRefreshFitScoreCountsRef.current();
      }, 1000);
    });

    return () => {
      mounted = false;
      if (refreshTimeout) {
        clearTimeout(refreshTimeout);
      }
      unsubscribe();
    };
  }, [setAllApplicantsForCounts, setFilteredApplicants, setTotal, subscribeToEvents]);

  return { realtimeConnected: isConnected };
}
