import { useEffect, type Dispatch, type MutableRefObject, type SetStateAction } from 'react';
import type { ApplicantFilterValues } from '@/components/applicants/ApplicantFilters';
import {
  clearApplicantHorizontalFitScoreFilters,
  getApplicantHorizontalFitScoreFilterAction,
} from '../applicant-page-utils';

interface UseApplicantHorizontalFitScoreSyncOptions {
  appliedGrades: ReadonlySet<string>;
  matchingGrades: ReadonlySet<string>;
  isClearingFilters: boolean;
  hasInitialDataFetch: boolean;
  filterChangeTimeoutRef: MutableRefObject<NodeJS.Timeout | null>;
  applyHorizontalFitScoreFilters: () => ApplicantFilterValues;
  setFilters: Dispatch<SetStateAction<ApplicantFilterValues>>;
  debounceMs?: number;
}

export function useApplicantHorizontalFitScoreSync({
  appliedGrades,
  matchingGrades,
  isClearingFilters,
  hasInitialDataFetch,
  filterChangeTimeoutRef,
  applyHorizontalFitScoreFilters,
  setFilters,
  debounceMs = 300,
}: UseApplicantHorizontalFitScoreSyncOptions) {
  useEffect(() => {
    if (isClearingFilters || !hasInitialDataFetch) {
      return;
    }

    if (filterChangeTimeoutRef.current) {
      clearTimeout(filterChangeTimeoutRef.current);
    }

    filterChangeTimeoutRef.current = setTimeout(() => {
      const horizontalFilterAction = getApplicantHorizontalFitScoreFilterAction({
        appliedGrades,
        matchingGrades,
        horizontalFilters: applyHorizontalFitScoreFilters(),
      });

      if (horizontalFilterAction.type === 'merge') {
        setFilters(prev => ({ ...prev, ...horizontalFilterAction.filters }));
      } else if (horizontalFilterAction.type === 'clear') {
        setFilters(clearApplicantHorizontalFitScoreFilters);
      }
    }, debounceMs);

    return () => {
      if (filterChangeTimeoutRef.current) {
        clearTimeout(filterChangeTimeoutRef.current);
      }
    };
  }, [
    appliedGrades,
    matchingGrades,
    isClearingFilters,
    hasInitialDataFetch,
    filterChangeTimeoutRef,
    applyHorizontalFitScoreFilters,
    setFilters,
    debounceMs,
  ]);
}
