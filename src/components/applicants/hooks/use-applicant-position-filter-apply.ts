import { useCallback, useRef } from 'react';
import type { ApplicantFilterValues } from '@/lib/types';
import { getApplicantPositionFilterApplyDecision } from '../applicant-filter-query-utils';
import type {
  ApplicantFilterApplyRefs,
  BuildCurrentStandardFilters,
} from './use-applicant-filter-apply-types';

interface UseApplicantPositionFilterApplyOptions {
  refs: Pick<ApplicantFilterApplyRefs, 'lastAppliedFiltersRef' | 'positionChangeTimeoutRef'>;
  buildCurrentStandardFilters: BuildCurrentStandardFilters;
  onFilterChange: (filters: ApplicantFilterValues) => void;
  setSelectedPositionIds: (value: Set<string>) => void;
}

export function useApplicantPositionFilterApply({
  refs,
  buildCurrentStandardFilters,
  onFilterChange,
  setSelectedPositionIds,
}: UseApplicantPositionFilterApplyOptions) {
  const isHandlingPositionChangeRef = useRef(false);
  const lastPositionChangeTimeRef = useRef(0);
  const { lastAppliedFiltersRef, positionChangeTimeoutRef } = refs;

  const handlePositionChange = useCallback((newSelectedIds: Set<string>) => {
    const now = Date.now();
    const newFilters = buildCurrentStandardFilters(
      { selectedPositionIds: newSelectedIds },
      { preserveEmptyTextFilters: false },
    );
    const applyDecision = getApplicantPositionFilterApplyDecision({
      now,
      lastPositionChangeTime: lastPositionChangeTimeRef.current,
      filters: newFilters,
      lastAppliedFiltersKey: lastAppliedFiltersRef.current || '',
    });

    if (applyDecision.type === 'skip-throttle') {
      return;
    }

    lastPositionChangeTimeRef.current = applyDecision.nextLastPositionChangeTime;
    isHandlingPositionChangeRef.current = true;
    setSelectedPositionIds(newSelectedIds);

    if (applyDecision.type === 'skip-duplicate') {
      isHandlingPositionChangeRef.current = false;
      return;
    }

    lastAppliedFiltersRef.current = applyDecision.nextLastAppliedFiltersKey;
    onFilterChange(applyDecision.filters);

    if (positionChangeTimeoutRef.current) {
      clearTimeout(positionChangeTimeoutRef.current);
      positionChangeTimeoutRef.current = null;
    }
    positionChangeTimeoutRef.current = setTimeout(() => {
      isHandlingPositionChangeRef.current = false;
      positionChangeTimeoutRef.current = null;
    }, 150);
  }, [
    buildCurrentStandardFilters,
    lastAppliedFiltersRef,
    onFilterChange,
    positionChangeTimeoutRef,
    setSelectedPositionIds,
  ]);

  return {
    handlePositionChange,
    isHandlingPositionChangeRef,
  };
}
