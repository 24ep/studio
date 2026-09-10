import { useCallback, useEffect, type Dispatch, type MutableRefObject, type SetStateAction } from 'react';
import type { ApplicantFilterValues } from '@/lib/types';
import {
  buildApplicantClearFiltersUrl,
  getApplicantAiSearchTotalUpdate,
  getClearedApplicantAiSearchState,
  shouldRefreshApplicantFitScoreCountsForFilterChange,
} from '../applicant-page-utils';
import { useApplicantFilterPin } from './use-applicant-filter-pin';
import { useApplicantHorizontalFitScoreFilters } from './use-applicant-horizontal-fit-score-filters';

interface ReplaceUrlOptions {
  scroll?: boolean;
}

interface UseApplicantsPageFilterControlsInput {
  filters: ApplicantFilterValues;
  pageSize: number;
  pathname: string;
  searchParamsString: string;
  isLoading: boolean;
  tableLoading: boolean;
  isClearingFilters: boolean;
  isAiSearchActive: boolean;
  aiMatchedApplicantIds: string[] | null;
  aiRecordCount: number;
  isFitScoreCountsLoadingState: boolean;
  filterChangeTimeoutRef: MutableRefObject<NodeJS.Timeout | null>;
  batchTimeoutRef: MutableRefObject<NodeJS.Timeout | null>;
  setPage: Dispatch<SetStateAction<number>>;
  setTotal: Dispatch<SetStateAction<number>>;
  setTableLoading: Dispatch<SetStateAction<boolean>>;
  setIsClearingFilters: Dispatch<SetStateAction<boolean>>;
  setAiMatchedApplicantIds: Dispatch<SetStateAction<string[] | null>>;
  setAiSearchReasoning: Dispatch<SetStateAction<string | null>>;
  setAiRecordCount: Dispatch<SetStateAction<number>>;
  setIsAiSearchActive: Dispatch<SetStateAction<boolean>>;
  setHorizontalSelectedFitScoreGrades: Dispatch<SetStateAction<Set<string>>>;
  setHorizontalSelectedMatchingFitScoreGrades: Dispatch<SetStateAction<Set<string>>>;
  handleFilterChange: (newFilters: ApplicantFilterValues, onApplied?: (filters: ApplicantFilterValues) => void) => void;
  clearAllFilters: () => ApplicantFilterValues;
  debouncedFetchFitScoreCounts: () => void;
  fetchTableData: (filters: ApplicantFilterValues, page: number, pageSize: number) => void;
  forceRefreshFitScoreCounts: () => void;
  replaceUrl: (url: string, options?: ReplaceUrlOptions) => void;
}

export function useApplicantsPageFilterControls({
  filters,
  pageSize,
  pathname,
  searchParamsString,
  isLoading,
  tableLoading,
  isClearingFilters,
  isAiSearchActive,
  aiMatchedApplicantIds,
  aiRecordCount,
  isFitScoreCountsLoadingState,
  filterChangeTimeoutRef,
  batchTimeoutRef,
  setPage,
  setTotal,
  setTableLoading,
  setIsClearingFilters,
  setAiMatchedApplicantIds,
  setAiSearchReasoning,
  setAiRecordCount,
  setIsAiSearchActive,
  setHorizontalSelectedFitScoreGrades,
  setHorizontalSelectedMatchingFitScoreGrades,
  handleFilterChange,
  clearAllFilters,
  debouncedFetchFitScoreCounts,
  fetchTableData,
  forceRefreshFitScoreCounts,
  replaceUrl,
}: UseApplicantsPageFilterControlsInput) {
  const {
    isFilterPinned,
    handleToggleFilterPin,
  } = useApplicantFilterPin();

  const {
    handleHorizontalFitScoreGradeToggle,
    handleHorizontalMatchingFitScoreGradeToggle,
    clearAllHorizontalFitScoreFilters,
  } = useApplicantHorizontalFitScoreFilters({
    setPage,
    setHorizontalSelectedFitScoreGrades,
    setHorizontalSelectedMatchingFitScoreGrades,
  });

  const onFilterChange = useCallback((newFilters: ApplicantFilterValues) => {
    if (isClearingFilters) {
      return;
    }

    const shouldRefreshFitScoreCounts = shouldRefreshApplicantFitScoreCountsForFilterChange(filters, newFilters);
    setPage(1);

    handleFilterChange(newFilters, () => {
      setTableLoading(true);

      const batchTimeout = setTimeout(() => {
        if (shouldRefreshFitScoreCounts) {
          debouncedFetchFitScoreCounts();
        }
      }, 300);

      if (batchTimeoutRef.current) {
        clearTimeout(batchTimeoutRef.current);
      }
      batchTimeoutRef.current = batchTimeout;
    });
  }, [
    batchTimeoutRef,
    debouncedFetchFitScoreCounts,
    filters,
    handleFilterChange,
    isClearingFilters,
    setPage,
    setTableLoading,
  ]);

  useEffect(() => {
    const nextAiSearchTotal = getApplicantAiSearchTotalUpdate({
      isLoading,
      tableLoading,
      isClearingFilters,
      isAiSearchActive,
      aiMatchedApplicantIds,
      aiRecordCount,
    });

    if (nextAiSearchTotal !== null) {
      setTotal(nextAiSearchTotal);
    }
  }, [
    aiMatchedApplicantIds,
    aiRecordCount,
    isAiSearchActive,
    isClearingFilters,
    isLoading,
    setTotal,
    tableLoading,
  ]);

  useEffect(() => {
    if (isClearingFilters && !isFitScoreCountsLoadingState) {
      setIsClearingFilters(false);
    }
  }, [isClearingFilters, isFitScoreCountsLoadingState]);

  const handleClearAllFilters = useCallback(() => {
    setIsClearingFilters(true);

    const clearedAiSearch = getClearedApplicantAiSearchState();
    setAiMatchedApplicantIds(clearedAiSearch.aiMatchedApplicantIds);
    setAiSearchReasoning(clearedAiSearch.aiSearchReasoning);
    setAiRecordCount(clearedAiSearch.aiRecordCount);
    setIsAiSearchActive(clearedAiSearch.isAiSearchActive);

    const defaultFilters = clearAllFilters();
    setPage(1);

    if (filterChangeTimeoutRef.current) {
      clearTimeout(filterChangeTimeoutRef.current);
      filterChangeTimeoutRef.current = null;
    }

    replaceUrl(buildApplicantClearFiltersUrl(pathname, searchParamsString), { scroll: false });

    const clearTimeoutId = setTimeout(() => {
      fetchTableData(defaultFilters, 1, pageSize);
      forceRefreshFitScoreCounts();
    }, 100);

    return () => {
      clearTimeout(clearTimeoutId);
    };
  }, [
    clearAllFilters,
    fetchTableData,
    filterChangeTimeoutRef,
    forceRefreshFitScoreCounts,
    pageSize,
    pathname,
    replaceUrl,
    searchParamsString,
    setAiMatchedApplicantIds,
    setAiRecordCount,
    setAiSearchReasoning,
    setIsClearingFilters,
    setIsAiSearchActive,
    setPage,
  ]);

  return {
    isClearingFilters,
    isFilterPinned,
    onFilterChange,
    handleClearAllFilters,
    handleToggleFilterPin,
    handleHorizontalFitScoreGradeToggle,
    handleHorizontalMatchingFitScoreGradeToggle,
    clearAllHorizontalFitScoreFilters,
  };
}
