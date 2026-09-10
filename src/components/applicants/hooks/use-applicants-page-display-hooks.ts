import { useApplicantDisplayState } from './use-applicant-display-state';
import { useApplicantsPageFilterControls } from './use-applicants-page-filter-controls';
import { useApplicantsPageUiState } from './use-applicants-page-ui-state';
import type { useApplicantsPageDataController } from './use-applicants-page-data-controller';
import type { UseApplicantsPageRuntimeControllerInput } from './use-applicants-page-runtime-controller-types';

type ApplicantsPageDataController = ReturnType<typeof useApplicantsPageDataController>;

interface UseApplicantsPageDisplayHooksOptions {
  applicantData: ApplicantsPageDataController;
  aiState: UseApplicantsPageRuntimeControllerInput['aiState'];
  filterState: UseApplicantsPageRuntimeControllerInput['filterState'];
  initialApplicants: UseApplicantsPageRuntimeControllerInput['initialApplicants'];
  localState: UseApplicantsPageRuntimeControllerInput['localState'];
  routing: UseApplicantsPageRuntimeControllerInput['routing'];
  settings: UseApplicantsPageRuntimeControllerInput['settings'];
}

export function useApplicantsPageDisplayHooks({
  applicantData,
  aiState,
  filterState,
  initialApplicants,
  localState,
  routing,
  settings,
}: UseApplicantsPageDisplayHooksOptions) {
  const uiState = useApplicantsPageUiState({
    applicantSettings: settings.applicantSettings,
    setApplicantSettings: settings.setApplicantSettings,
    setPage: localState.setPage,
  });

  const {
    applicantScoreCounts,
    applicantsToRender,
    displayedApplicants,
    isFitScoreCountsLoadingState,
    totalPages,
  } = useApplicantDisplayState({
    isAiSearchActive: aiState.isAiSearchActive,
    aiMatchedApplicantIds: aiState.aiMatchedApplicantIds,
    aiRecordCount: aiState.aiRecordCount,
    total: localState.total,
    page: localState.page,
    pageSize: settings.pageSize,
    allApplicantsForCounts: applicantData.allApplicantsForCounts,
    databaseFitScoreCounts: applicantData.databaseFitScoreCounts,
    filteredApplicants: applicantData.filteredApplicants,
    availablePositions: applicantData.availablePositions,
    availableRecruiter: applicantData.availableRecruiter,
    availableSources: applicantData.availableSources,
    initialApplicants,
    isLoading: applicantData.isLoading,
    tableLoading: localState.tableLoading,
    isFetching: applicantData.isFetching,
    tableError: localState.tableError,
    fetchError: applicantData.fetchError,
    isFitScoreCountsLoading: applicantData.isFitScoreCountsLoading,
  });

  const filterControls = useApplicantsPageFilterControls({
    filters: filterState.filters,
    pageSize: settings.pageSize,
    pathname: routing.pathname,
    searchParamsString: routing.searchParams.toString(),
    isLoading: applicantData.isLoading,
    tableLoading: localState.tableLoading,
    isClearingFilters: localState.isClearingFilters,
    isAiSearchActive: aiState.isAiSearchActive,
    aiMatchedApplicantIds: aiState.aiMatchedApplicantIds,
    aiRecordCount: aiState.aiRecordCount,
    isFitScoreCountsLoadingState,
    filterChangeTimeoutRef: filterState.filterChangeTimeoutRef,
    batchTimeoutRef: localState.batchTimeoutRef,
    setPage: localState.setPage,
    setTotal: localState.setTotal,
    setTableLoading: localState.setTableLoading,
    setIsClearingFilters: localState.setIsClearingFilters,
    setAiMatchedApplicantIds: aiState.setAiMatchedApplicantIds,
    setAiSearchReasoning: aiState.setAiSearchReasoning,
    setAiRecordCount: aiState.setAiRecordCount,
    setIsAiSearchActive: aiState.setIsAiSearchActive,
    setHorizontalSelectedFitScoreGrades: filterState.setHorizontalSelectedFitScoreGrades,
    setHorizontalSelectedMatchingFitScoreGrades: filterState.setHorizontalSelectedMatchingFitScoreGrades,
    handleFilterChange: filterState.handleFilterChange,
    clearAllFilters: filterState.clearAllFilters,
    debouncedFetchFitScoreCounts: applicantData.debouncedFetchFitScoreCounts,
    fetchTableData: applicantData.fetchTableData,
    forceRefreshFitScoreCounts: applicantData.forceRefreshFitScoreCounts,
    replaceUrl: routing.replaceUrl,
  });

  return {
    applicantScoreCounts,
    applicantsToRender,
    displayedApplicants,
    filterControls,
    totalPages,
    uiState,
  };
}
