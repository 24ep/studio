"use client";

import { useEnhancedSSE } from "@/hooks/use-enhanced-sse";

import type { usePositionReferenceData } from "./hooks/use-position-reference-data";
import { usePositionsPageEffects } from "./hooks/use-positions-page-effects";
import type { usePositionsPageFilters } from "./hooks/use-positions-page-filters";
import { usePositionsRealtimeRefresh } from "./hooks/use-positions-realtime-refresh";
import type { usePositionsPageDataController } from "./use-positions-page-data-controller";
import type { usePositionsPageRuntime } from "./use-positions-page-runtime";

type UsePositionsPageControllerEffectsInput = {
  dataController: ReturnType<typeof usePositionsPageDataController>;
  filters: ReturnType<typeof usePositionsPageFilters>;
  referenceData: ReturnType<typeof usePositionReferenceData>;
  runtime: ReturnType<typeof usePositionsPageRuntime>;
};

export function usePositionsPageControllerEffects({
  dataController,
  filters,
  referenceData,
  runtime,
}: UsePositionsPageControllerEffectsInput) {
  const {
    isPreferencesLoaded,
    isUpdatingURLRef,
    searchParams,
    session,
    status,
  } = runtime;
  const {
    availableHiringManagers,
    fetchPositions,
    headcountData,
    isLoading,
    isSearching,
    isTableLoading,
    positions,
    setAvailableHiringManagers,
    setIsLoading,
    setIsSearching,
    setIsTableLoading,
    setVacantFromOpenPositions,
  } = dataController.dataState;
  const { searchControls } = dataController;

  useEnhancedSSE();

  usePositionsPageEffects({
    searchParams,
    searchTerm: filters.searchTerm,
    statusFilter: filters.statusFilter,
    page: filters.page,
    pageSize: filters.pageSize,
    departmentFilter: filters.departmentFilter,
    selectedRecruiterId: filters.selectedRecruiterId,
    selectedHiringManagerId: filters.selectedHiringManagerId,
    gradeFilter: filters.gradeFilter,
    isLoading,
    isTableLoading,
    isSearching,
    positions,
    headcountData,
    sessionUserId: session?.user?.id,
    isPreferencesLoaded,
    positionFilterSnapshot: filters.filterSnapshot,
    searchTimeoutRef: searchControls.searchTimeoutRef,
    searchStuckTimeoutRef: dataController.searchStuckTimeoutRef,
    hasInitialLoadRef: dataController.hasInitialLoadRef,
    isLoadingRef: dataController.isLoadingRef,
    isTableLoadingRef: dataController.isTableLoadingRef,
    isSearchingRef: dataController.isSearchingRef,
    fetchPositionsRef: dataController.fetchPositionsRef,
    currentFiltersRef: dataController.currentFiltersRef,
    isUpdatingURLRef,
    setSearchTerm: filters.setSearchTerm,
    setStatusFilter: filters.setStatusFilter,
    setPage: filters.setPage,
    setPageSize: filters.setPageSize,
    setIsLoading,
    setIsTableLoading,
    setIsSearching,
    setAvailableHiringManagers,
    setVacantFromOpenPositions,
    fetchPositions,
    fetchAllDepartments: referenceData.fetchAllDepartments,
    fetchRecruiterStats: referenceData.fetchRecruiterStats,
    fetchGrades: referenceData.fetchGrades,
    resetReferenceLoading: referenceData.resetReferenceLoading,
  });

  usePositionsRealtimeRefresh({
    status,
    sessionUserId: session?.user?.id,
    isTableLoading,
    isSearching,
    fetchPositions,
    fetchRecruiterStats: referenceData.fetchRecruiterStats,
  });

  return {
    availableHiringManagers,
  };
}
