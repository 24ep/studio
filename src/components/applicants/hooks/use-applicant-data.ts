import { useCallback } from 'react';
import type { Applicant, Position, RecruitmentStage } from '@/lib/types';
import type { ApplicantFilterValues } from '@/components/applicants/ApplicantFilters';
import { useApplicantFitScoreCounts } from './use-applicant-fit-score-counts';
import {
  fetchApplicantById as fetchApplicantByIdFromApi,
  getBestMatchingFitScore,
} from './applicant-data-utils';
import { useApplicantCountsLoader } from './use-applicant-counts-loader';
import { useApplicantDataInitialEffects } from './use-applicant-data-initial-effects';
import { useApplicantReferenceData } from './use-applicant-reference-data';
import { useApplicantDataState } from './use-applicant-data-state';
import { useApplicantListUpdates } from './use-applicant-list-updates';

interface UseApplicantDataProps {
  initialApplicants: Applicant[];
  initialAvailablePositions: Position[];
  initialAvailableStages: RecruitmentStage[];
  sessionStatus: string;
  serverAuthError: boolean;
  serverPermissionError: boolean;
  initialFetchError?: string;
  filters?: ApplicantFilterValues;
}

export function useApplicantData({
  initialApplicants,
  initialAvailablePositions,
  initialAvailableStages,
  sessionStatus,
  serverAuthError,
  serverPermissionError,
  initialFetchError,
  filters
}: UseApplicantDataProps) {
  const dataState = useApplicantDataState({
    initialFetchError,
    serverAuthError,
    serverPermissionError,
  });
  const {
    allApplicantsForCounts,
    authError,
    currentRequestRef,
    fetchError,
    fetchTimeoutRef,
    filteredApplicants,
    hasInitialFetch,
    isFetching,
    isLoading,
    latestRequestIdRef,
    permissionError,
    setAllApplicantsForCounts,
    setAuthError,
    setFetchError,
    setFilteredApplicants,
    setHasInitialFetch,
    setIsFetching,
    setIsLoading,
    setPermissionError,
  } = dataState;
  const {
    databaseFitScoreCounts,
    isFitScoreCountsLoading,
    fetchFitScoreCounts,
    debouncedFetchFitScoreCounts,
    forceRefreshFitScoreCounts,
  } = useApplicantFitScoreCounts({ filters });
  const {
    availablePositions,
    setAvailablePositions,
    availableStages,
    setAvailableStages,
    availableRecruiter,
    setAvailableRecruiter,
    availableSources,
    setAvailableSources,
    fetchRecruiter,
    fetchSources,
  } = useApplicantReferenceData({
    initialAvailablePositions,
    initialAvailableStages,
    sessionStatus,
  });

  const fetchAllApplicantsForCounts = useApplicantCountsLoader({
    sessionStatus,
    setAllApplicantsForCounts,
    setIsLoading,
  });

  useApplicantDataInitialEffects({
    fetchAllApplicantsForCounts,
    fetchFitScoreCounts,
    initialApplicants,
    sessionStatus,
    setAllApplicantsForCounts,
    setFilteredApplicants,
    setHasInitialFetch,
  });

  const fetchApplicantById = useCallback(async (applicantId: string): Promise<Applicant | null> => {
    try {
      return await fetchApplicantByIdFromApi(applicantId);
    } catch (error) {
      return null;
    }
  }, []);

  const {
    applyOptimisticUpdate,
    refreshApplicantInList,
    revertOptimisticUpdate,
  } = useApplicantListUpdates({
    fetchApplicantById,
    setAllApplicantsForCounts,
    setFilteredApplicants,
  });

  return {
    // State
    filteredApplicants,
    setFilteredApplicants,
    allApplicantsForCounts,
    setAllApplicantsForCounts,
    availablePositions,
    setAvailablePositions,
    availableStages,
    setAvailableStages,
    availableRecruiter,
    setAvailableRecruiter,
    availableSources,
    setAvailableSources,
    isLoading,
    setIsLoading,
    isFetching,
    setIsFetching,
    hasInitialFetch,
    setHasInitialFetch,
    fetchError,
    setFetchError,
    authError,
    setAuthError,
    permissionError,
    setPermissionError,

    // Refs
    fetchTimeoutRef,
    currentRequestRef,
    latestRequestIdRef,

    // Functions
    getBestMatchingFitScore,
    fetchRecruiter,
    fetchSources,
    fetchAllApplicantsForCounts,
    fetchApplicantById,
    refreshApplicantInList,
    applyOptimisticUpdate,
    revertOptimisticUpdate,
    // Database-level fit score counts
    databaseFitScoreCounts,
    isFitScoreCountsLoading,
    fetchFitScoreCounts,
    debouncedFetchFitScoreCounts, // Expose debounced function
    forceRefreshFitScoreCounts // Expose force refresh function
  };
}
