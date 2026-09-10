import type { Dispatch, MutableRefObject, RefObject, SetStateAction } from 'react';
import type { Applicant, ApplicantFilterValues } from '@/lib/types';
import type { useApplicantsPageDataController } from './use-applicants-page-data-controller';
import type { useApplicantsPageUiState } from './use-applicants-page-ui-state';

type ApplicantsPageDataController = ReturnType<typeof useApplicantsPageDataController>;

export interface UseApplicantsPageRuntimeControllerInput {
  applicantData: ApplicantsPageDataController;
  aiState: {
    aiMatchedApplicantIds: string[] | null;
    aiRecordCount: number;
    isAiSearchActive: boolean;
    setAiMatchedApplicantIds: Dispatch<SetStateAction<string[] | null>>;
    setAiRecordCount: Dispatch<SetStateAction<number>>;
    setAiSearchReasoning: Dispatch<SetStateAction<string | null>>;
    setIsAiSearchActive: Dispatch<SetStateAction<boolean>>;
    stableSetAiMatchedApplicantIds: (ids: string[] | null) => void;
    stableSetAiRecordCount: (count: number) => void;
    stableSetAiSearchReasoning: (reasoning: string | null) => void;
    stableSetIsAiSearchActive: (active: boolean) => void;
    handleOpenSearchDrawer: () => void;
  };
  filterState: {
    advancedQuery?: string;
    applyHorizontalFitScoreFilters: () => ApplicantFilterValues;
    clearAllFilters: () => ApplicantFilterValues;
    filterChangeTimeoutRef: MutableRefObject<NodeJS.Timeout | null>;
    filters: ApplicantFilterValues;
    handleFilterChange: (newFilters: ApplicantFilterValues, onApplied?: (filters: ApplicantFilterValues) => void) => void;
    horizontalSelectedFitScoreGrades: Set<string>;
    horizontalSelectedMatchingFitScoreGrades: Set<string>;
    isFilterDataLoading: boolean;
    setFilters: Dispatch<SetStateAction<ApplicantFilterValues>>;
    setHorizontalSelectedFitScoreGrades: Dispatch<SetStateAction<Set<string>>>;
    setHorizontalSelectedMatchingFitScoreGrades: Dispatch<SetStateAction<Set<string>>>;
  };
  initialApplicants: Applicant[];
  initialFetchError?: string;
  localState: {
    addFilterRef: (element: HTMLElement) => void;
    batchTimeoutRef: MutableRefObject<NodeJS.Timeout | null>;
    hasInitialDataFetch: boolean;
    isClearingFilters: boolean;
    page: number;
    removeFilterRef: (element: HTMLElement) => void;
    setHasInitialDataFetch: Dispatch<SetStateAction<boolean>>;
    setIsClearingFilters: Dispatch<SetStateAction<boolean>>;
    setPage: Dispatch<SetStateAction<number>>;
    setTableError: Dispatch<SetStateAction<string | null>>;
    setTableLoading: Dispatch<SetStateAction<boolean>>;
    setTotal: Dispatch<SetStateAction<number>>;
    sidebarFilterRef: RefObject<HTMLElement | null>;
    tableError: string | null;
    tableHeight: number;
    tableLoading: boolean;
    total: number;
  };
  routing: {
    pathname: string;
    searchParams: URLSearchParams;
    session: { user?: { id?: string } } | null;
    sessionStatus: string;
    serverAuthError: boolean;
    serverPermissionError: boolean;
    replaceUrl: (url: string, options?: { scroll?: boolean }) => void;
  };
  settings: {
    applicantSettings: Parameters<typeof useApplicantsPageUiState>[0]['applicantSettings'];
    setApplicantSettings: Parameters<typeof useApplicantsPageUiState>[0]['setApplicantSettings'];
    settingsError: string | null;
    settingsLoading: boolean;
    clearSettingsError: () => void;
    pageSize: number;
    sortColumn: string;
    sortDirection: 'asc' | 'desc' | null;
  };
}
