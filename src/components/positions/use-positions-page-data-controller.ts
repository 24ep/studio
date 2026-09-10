"use client";

import { useCallback, useRef, useState } from "react";
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh";
import { usePositionsPageDataState } from "./hooks/use-positions-page-data-state";
import { usePositionsPageSearchControls } from "./hooks/use-positions-page-search-controls";
import type { usePositionsPageFilters } from "./hooks/use-positions-page-filters";

type PositionsPageFilters = ReturnType<typeof usePositionsPageFilters>;

export function usePositionsPageDataController({
  filters,
  isMobile,
}: {
  filters: PositionsPageFilters;
  isMobile: boolean;
}) {
  const [mobileDisplayCount, setMobileDisplayCount] = useState(20);
  const searchStuckTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialLoadRef = useRef(true);
  const hasInitialLoadRef = useRef(false);
  const isLoadingRef = useRef(false);
  const isTableLoadingRef = useRef(false);
  const isSearchingRef = useRef(false);
  const fetchPositionsRef = useRef<((isSearch?: boolean, customPage?: number, signal?: AbortSignal) => Promise<void>) | null>(null);
  const currentFiltersRef = useRef(filters.filterSnapshot);
  const contentRef = useRef<HTMLDivElement>(null);

  const dataState = usePositionsPageDataState({
    currentFiltersRef,
    isInitialLoadRef,
  });

  const searchControls = usePositionsPageSearchControls({
    isSearching: dataState.isSearching,
    resetPagination: filters.resetPagination,
    setIsSearching: dataState.setIsSearching,
    setSearchTerm: filters.setSearchTerm,
  });

  const handleRefreshPositions = useCallback(async () => {
    if (fetchPositionsRef.current) {
      await fetchPositionsRef.current(false);
    }
  }, []);

  const pullToRefresh = usePullToRefresh({
    onRefresh: handleRefreshPositions,
    enabled: isMobile,
  });

  return {
    contentRef,
    currentFiltersRef,
    dataState,
    fetchPositionsRef,
    hasInitialLoadRef,
    isInitialLoadRef,
    isLoadingRef,
    isSearchingRef,
    isTableLoadingRef,
    mobileDisplayCount,
    pullToRefresh,
    searchControls,
    searchStuckTimeoutRef,
    setMobileDisplayCount,
  };
}
