import { useEffect, useRef } from 'react';

import { hasActivePositionLoadingState } from '../position-page-utils';
import type { UsePositionsPageEffectsInput } from './use-positions-page-effects-types';

type LoadingEffectsInput = Pick<
  UsePositionsPageEffectsInput,
  | 'currentFiltersRef'
  | 'fetchPositions'
  | 'fetchPositionsRef'
  | 'isLoading'
  | 'isLoadingRef'
  | 'isSearching'
  | 'isSearchingRef'
  | 'isTableLoading'
  | 'isTableLoadingRef'
  | 'positionFilterSnapshot'
  | 'resetReferenceLoading'
  | 'searchStuckTimeoutRef'
  | 'searchTimeoutRef'
  | 'setIsLoading'
  | 'setIsSearching'
  | 'setIsTableLoading'
>;

export function usePositionsPageLoadingEffects({
  currentFiltersRef,
  fetchPositions,
  fetchPositionsRef,
  isLoading,
  isLoadingRef,
  isSearching,
  isSearchingRef,
  isTableLoading,
  isTableLoadingRef,
  positionFilterSnapshot,
  resetReferenceLoading,
  searchStuckTimeoutRef,
  searchTimeoutRef,
  setIsLoading,
  setIsSearching,
  setIsTableLoading,
}: LoadingEffectsInput) {
  const hasRunGlobalTimeoutRef = useRef(false);

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      if (searchStuckTimeoutRef.current) {
        clearTimeout(searchStuckTimeoutRef.current);
      }

      setIsLoading(false);
      setIsTableLoading(false);
      setIsSearching(false);
    };
  }, [searchStuckTimeoutRef, searchTimeoutRef, setIsLoading, setIsSearching, setIsTableLoading]);

  useEffect(() => {
    currentFiltersRef.current = positionFilterSnapshot;
  }, [currentFiltersRef, positionFilterSnapshot]);

  useEffect(() => {
    isLoadingRef.current = isLoading;
  }, [isLoading, isLoadingRef]);

  useEffect(() => {
    isTableLoadingRef.current = isTableLoading;
  }, [isTableLoading, isTableLoadingRef]);

  useEffect(() => {
    isSearchingRef.current = isSearching;
  }, [isSearching, isSearchingRef]);

  useEffect(() => {
    fetchPositionsRef.current = fetchPositions;
  }, [fetchPositions, fetchPositionsRef]);

  useEffect(() => {
    if (isSearching) {
      searchStuckTimeoutRef.current = setTimeout(() => {
        setIsSearching(false);
      }, 5000);
    } else if (searchStuckTimeoutRef.current) {
      clearTimeout(searchStuckTimeoutRef.current);
      searchStuckTimeoutRef.current = null;
    }

    return () => {
      if (searchStuckTimeoutRef.current) {
        clearTimeout(searchStuckTimeoutRef.current);
      }
    };
  }, [isSearching, searchStuckTimeoutRef, setIsSearching]);

  useEffect(() => {
    if (hasRunGlobalTimeoutRef.current) {
      return;
    }
    hasRunGlobalTimeoutRef.current = true;

    const globalTimeout = setTimeout(() => {
      if (hasActivePositionLoadingState({
        isLoading: isLoadingRef.current,
        isTableLoading: isTableLoadingRef.current,
        isSearching: isSearchingRef.current,
      })) {
        console.warn('Positions page loading states stuck for 30+ seconds, resetting...');
        setIsLoading(false);
        setIsTableLoading(false);
        setIsSearching(false);
        resetReferenceLoading();
      }
    }, 30000);

    return () => clearTimeout(globalTimeout);
  }, [isLoadingRef, isSearchingRef, isTableLoadingRef, resetReferenceLoading, setIsLoading, setIsSearching, setIsTableLoading]);
}
