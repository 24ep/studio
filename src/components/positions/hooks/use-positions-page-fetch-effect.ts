import { useEffect, useRef } from 'react';

import type { UsePositionsPageEffectsInput } from './use-positions-page-effects-types';

type FetchEffectInput = Pick<
  UsePositionsPageEffectsInput,
  | 'departmentFilter'
  | 'fetchPositionsRef'
  | 'gradeFilter'
  | 'hasInitialLoadRef'
  | 'isSearchingRef'
  | 'isUpdatingURLRef'
  | 'page'
  | 'pageSize'
  | 'searchTerm'
  | 'searchTimeoutRef'
  | 'selectedHiringManagerId'
  | 'selectedRecruiterId'
  | 'setIsSearching'
  | 'statusFilter'
>;

export function usePositionsPageFetchEffect({
  departmentFilter,
  fetchPositionsRef,
  gradeFilter,
  hasInitialLoadRef,
  isSearchingRef,
  isUpdatingURLRef,
  page,
  pageSize,
  searchTerm,
  searchTimeoutRef,
  selectedHiringManagerId,
  selectedRecruiterId,
  setIsSearching,
  statusFilter,
}: FetchEffectInput) {
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!hasInitialLoadRef.current) {
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        isUpdatingURLRef.current = true;

        const fetchFn = fetchPositionsRef.current;
        if (fetchFn) {
          await fetchFn(isSearchingRef.current, page, controller.signal);
        }

        setTimeout(() => {
          isUpdatingURLRef.current = false;
        }, 300);
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') return;
        setIsSearching(false);
        isUpdatingURLRef.current = false;
      } finally {
        searchTimeoutRef.current = null;
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = null;
      }
    };
  }, [
    departmentFilter,
    fetchPositionsRef,
    gradeFilter,
    hasInitialLoadRef,
    isSearchingRef,
    isUpdatingURLRef,
    page,
    pageSize,
    searchTerm,
    searchTimeoutRef,
    selectedHiringManagerId,
    selectedRecruiterId,
    setIsSearching,
    statusFilter,
  ]);
}
