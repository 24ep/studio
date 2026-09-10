import { useCallback } from 'react';
import { useApplicantHorizontalFitScoreSync } from './use-applicant-horizontal-fit-score-sync';
import { useApplicantImportExport } from './use-applicant-import-export';
import { useApplicantMissingPositions } from './use-applicant-missing-positions';
import { useApplicantPinnedList } from './use-applicant-pinned-list';
import { useApplicantsPageDisplayHooks } from './use-applicants-page-display-hooks';
import { useApplicantsPageEffects } from './use-applicants-page-effects';
import { useApplicantsPageInteractionHooks } from './use-applicants-page-interaction-hooks';
import type { UseApplicantsPageRuntimeControllerInput } from './use-applicants-page-runtime-controller-types';

export function useApplicantsPageRuntimeController({
  applicantData,
  aiState,
  filterState,
  initialApplicants,
  initialFetchError,
  localState,
  routing,
  settings,
}: UseApplicantsPageRuntimeControllerInput) {
  const {
    filteredApplicants,
    setFilteredApplicants,
    allApplicantsForCounts,
    setAllApplicantsForCounts,
    availablePositions,
    setAvailablePositions,
    availableRecruiter,
    availableSources,
    isLoading,
    isFetching,
    fetchError,
    fetchRecruiter,
    fetchSources,
    fetchAllApplicantsForCounts,
    databaseFitScoreCounts,
    isFitScoreCountsLoading,
    debouncedFetchFitScoreCounts,
    forceRefreshFitScoreCounts,
    fetchTableData,
    currentRequestRefFromHook,
  } = applicantData;

  const {
    bulkActions,
    cancelAiSearch,
    handleAiSearch,
    isAiSearching,
    realtimeConnected,
    rowActions,
  } = useApplicantsPageInteractionHooks({
    applicantData,
    aiState,
    filterState,
    localState,
    routing,
    settings,
  });

  const {
    applicantScoreCounts,
    applicantsToRender,
    displayedApplicants,
    filterControls,
    totalPages,
    uiState,
  } = useApplicantsPageDisplayHooks({
    applicantData,
    aiState,
    filterState,
    initialApplicants,
    localState,
    routing,
    settings,
  });

  const { allPinnedApplicants, fetchAllPinnedApplicants } = useApplicantPinnedList({
    filters: filterState.filters,
    hasInitialDataFetch: localState.hasInitialDataFetch,
    isClearingFilters: localState.isClearingFilters,
  });

  useApplicantHorizontalFitScoreSync({
    appliedGrades: filterState.horizontalSelectedFitScoreGrades,
    matchingGrades: filterState.horizontalSelectedMatchingFitScoreGrades,
    isClearingFilters: localState.isClearingFilters,
    hasInitialDataFetch: localState.hasInitialDataFetch,
    filterChangeTimeoutRef: filterState.filterChangeTimeoutRef,
    applyHorizontalFitScoreFilters: filterState.applyHorizontalFitScoreFilters,
    setFilters: filterState.setFilters,
  });

  const importExport = useApplicantImportExport({
    filters: filterState.filters,
    setTableLoading: localState.setTableLoading,
    setIsImportModalOpen: uiState.setIsImportModalOpen,
  });

  const refreshCurrentApplicantsPage = useCallback(async () => {
    if (filterState.filters) {
      await fetchTableData(filterState.filters, localState.page, settings.pageSize);
    }
  }, [fetchTableData, filterState.filters, localState.page, settings.pageSize]);

  useApplicantMissingPositions({
    applicants: filteredApplicants,
    availablePositions,
    setAvailablePositions,
  });

  useApplicantsPageEffects({
    sessionStatus: routing.sessionStatus,
    serverAuthError: routing.serverAuthError,
    serverPermissionError: routing.serverPermissionError,
    initialApplicantsCount: initialApplicants.length,
    filteredApplicantsCount: filteredApplicants.length,
    initialFetchError,
    filters: filterState.filters,
    page: localState.page,
    pageSize: settings.pageSize,
    sortColumn: settings.sortColumn,
    sortDirection: settings.sortDirection,
    settingsLoading: settings.settingsLoading,
    isClearingFilters: localState.isClearingFilters,
    hasInitialDataFetch: localState.hasInitialDataFetch,
    realtimeConnected,
    searchParams: routing.searchParams,
    currentRequestRef: currentRequestRefFromHook,
    filterChangeTimeoutRef: filterState.filterChangeTimeoutRef,
    batchTimeoutRef: localState.batchTimeoutRef,
    sidebarFilterRef: localState.sidebarFilterRef,
    setHasInitialDataFetch: localState.setHasInitialDataFetch,
    setIsLoading: applicantData.setIsLoading,
    setTableLoading: localState.setTableLoading,
    fetchRecruiter,
    fetchSources,
    fetchTableData,
    fetchAllApplicantsForCounts,
    forceRefreshFitScoreCounts,
    addFilterRef: localState.addFilterRef,
    removeFilterRef: localState.removeFilterRef,
    onOpenSearchDrawer: aiState.handleOpenSearchDrawer,
  });

  return {
    allPinnedApplicants,
    applicantScoreCounts,
    applicantsToRender,
    bulkActions,
    cancelAiSearch,
    displayedApplicants,
    fetchAllPinnedApplicants,
    filterControls,
    handleAiSearch,
    importExport,
    isAiSearching,
    refreshCurrentApplicantsPage,
    rowActions,
    totalPages,
    uiState,
  };
}
