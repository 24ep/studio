import { useApplicantActions } from './use-applicant-actions';
import { useApplicantAiSearch } from './use-applicant-ai-search';
import { useApplicantBulkActions } from './use-applicant-bulk-actions';
import { useApplicantRealtimeRefresh } from './use-applicant-realtime-refresh';
import type { useApplicantsPageDataController } from './use-applicants-page-data-controller';
import type { UseApplicantsPageRuntimeControllerInput } from './use-applicants-page-runtime-controller-types';

type ApplicantsPageDataController = ReturnType<typeof useApplicantsPageDataController>;

interface UseApplicantsPageInteractionHooksOptions {
  applicantData: ApplicantsPageDataController;
  aiState: UseApplicantsPageRuntimeControllerInput['aiState'];
  filterState: UseApplicantsPageRuntimeControllerInput['filterState'];
  localState: UseApplicantsPageRuntimeControllerInput['localState'];
  routing: UseApplicantsPageRuntimeControllerInput['routing'];
  settings: UseApplicantsPageRuntimeControllerInput['settings'];
}

export function useApplicantsPageInteractionHooks({
  applicantData,
  aiState,
  filterState,
  localState,
  routing,
  settings,
}: UseApplicantsPageInteractionHooksOptions) {
  const rowActions = useApplicantActions({
    setFilteredApplicants: applicantData.setFilteredApplicants,
    setAllApplicantsForCounts: applicantData.setAllApplicantsForCounts,
    fetchTableData: applicantData.fetchTableData,
    filters: filterState.filters,
    page: localState.page,
    pageSize: settings.pageSize,
    aiMatchedApplicantIds: aiState.aiMatchedApplicantIds,
  });

  const { realtimeConnected } = useApplicantRealtimeRefresh({
    sessionStatus: routing.sessionStatus,
    sessionUserId: routing.session?.user?.id,
    isLoading: applicantData.isLoading,
    filters: filterState.filters,
    page: localState.page,
    pageSize: settings.pageSize,
    fetchTableData: applicantData.fetchTableData,
    fetchAllApplicantsForCounts: applicantData.fetchAllApplicantsForCounts,
    forceRefreshFitScoreCounts: applicantData.forceRefreshFitScoreCounts,
    setFilteredApplicants: applicantData.setFilteredApplicants,
    setAllApplicantsForCounts: applicantData.setAllApplicantsForCounts,
    setTotal: localState.setTotal,
  });

  const bulkActions = useApplicantBulkActions({
    fetchTableData: applicantData.fetchTableData,
    fetchAllApplicantsForCounts: applicantData.fetchAllApplicantsForCounts,
    filters: filterState.filters,
    page: localState.page,
    pageSize: settings.pageSize,
    availableRecruiter: applicantData.availableRecruiter,
  });

  const { isAiSearching, handleAiSearch, cancelAiSearch } = useApplicantAiSearch({
    setFilteredApplicants: applicantData.setFilteredApplicants,
    setAiMatchedApplicantIds: aiState.stableSetAiMatchedApplicantIds,
    setAiSearchReasoning: aiState.stableSetAiSearchReasoning,
    setAiRecordCount: aiState.stableSetAiRecordCount,
    setIsAiSearchActive: aiState.stableSetIsAiSearchActive,
    filteredApplicants: applicantData.filteredApplicants,
  });

  return {
    bulkActions,
    cancelAiSearch,
    handleAiSearch,
    isAiSearching,
    realtimeConnected,
    rowActions,
  };
}
