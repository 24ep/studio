import type { ApplicantFilterValues, Applicant, Position, RecruitmentStage } from '@/lib/types';
import { useApplicantData } from './use-applicant-data';
import { useApplicantFetching } from './use-applicant-fetching';
import type { useApplicantsPageFilterState } from './use-applicants-page-client-primitives';
import { useApplicantsPageDerivedState } from './use-applicants-page-derived-state';

type ApplicantFilterData = ReturnType<typeof useApplicantsPageFilterState>['filterData'];

interface UseApplicantsPageDataControllerInput {
  initialApplicants: Applicant[];
  initialAvailablePositions: Position[];
  initialAvailableStages: RecruitmentStage[];
  sessionStatus: string;
  serverAuthError: boolean;
  serverPermissionError: boolean;
  initialFetchError?: string;
  filters: ApplicantFilterValues;
  filterData: ApplicantFilterData;
  modulePermissions?: unknown;
  isClearingFilters: boolean;
  hasInitialDataFetch: boolean;
  searchParams: URLSearchParams;
  sortColumn: string;
  sortDirection: 'asc' | 'desc' | null;
  setTotal: (total: number) => void;
  setTableError: (error: string | null) => void;
  setTableLoading: (loading: boolean) => void;
  showPinSection: boolean;
}

export function useApplicantsPageDataController({
  initialApplicants,
  initialAvailablePositions,
  initialAvailableStages,
  sessionStatus,
  serverAuthError,
  serverPermissionError,
  initialFetchError,
  filters,
  filterData,
  modulePermissions,
  isClearingFilters,
  hasInitialDataFetch,
  searchParams,
  sortColumn,
  sortDirection,
  setTotal,
  setTableError,
  setTableLoading,
  showPinSection,
}: UseApplicantsPageDataControllerInput) {
  const data = useApplicantData({
    initialApplicants,
    initialAvailablePositions,
    initialAvailableStages,
    sessionStatus,
    serverAuthError,
    serverPermissionError,
    initialFetchError,
    filters,
  });

  const effectiveData = useApplicantsPageDerivedState({
    filterData,
    fallbackData: {
      positions: data.availablePositions,
      stages: data.availableStages,
      recruiters: data.availableRecruiter,
      sources: data.availableSources,
    },
    filteredApplicants: data.filteredApplicants,
    filters,
    modulePermissions,
  });

  const {
    fetchTableData,
    currentRequestRef: currentRequestRefFromHook,
  } = useApplicantFetching({
    sessionStatus,
    serverAuthError,
    serverPermissionError,
    isClearingFilters,
    hasInitialDataFetch,
    searchParams,
    sortColumn,
    sortDirection,
    setFilteredApplicants: data.setFilteredApplicants,
    setTotal,
    setTableError,
    setTableLoading,
    setIsFetching: data.setIsFetching,
    setAuthError: data.setAuthError,
    setPermissionError: data.setPermissionError,
    setFetchError: data.setFetchError,
    setIsLoading: data.setIsLoading,
    getShowPinSection: () => showPinSection,
  });

  return {
    ...data,
    effectiveData,
    fetchTableData,
    currentRequestRefFromHook,
  };
}
