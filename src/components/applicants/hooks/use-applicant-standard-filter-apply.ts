import { useCallback, useRef, useState } from 'react';
import type { ApplicantFilterValues } from '@/lib/types';
import {
  getApplicantStandardFilterApplyDecision,
  hasEmptyApplicantTextFilters,
} from '../applicant-filter-query-utils';
import type {
  ApplicantFilterApplyRefs,
  ApplicantFilterTextFilters,
  BuildCurrentStandardFilters,
} from './use-applicant-filter-apply-types';

interface UseApplicantStandardFilterApplyOptions {
  textFilters: ApplicantFilterTextFilters;
  refs: Pick<ApplicantFilterApplyRefs,
    | 'multiselectTimeoutRef'
    | 'skillsTimeoutRef'
    | 'applyingFiltersTimeoutRef'
    | 'lastAppliedFiltersRef'
  >;
  buildCurrentStandardFilters: BuildCurrentStandardFilters;
  onFilterChange: (filters: ApplicantFilterValues) => void;
}

export function useApplicantStandardFilterApply({
  textFilters,
  refs,
  buildCurrentStandardFilters,
  onFilterChange,
}: UseApplicantStandardFilterApplyOptions) {
  const [isApplyingFilters, setIsApplyingFilters] = useState(false);
  const lastFilterApplyTimeRef = useRef(0);
  const {
    multiselectTimeoutRef,
    skillsTimeoutRef,
    applyingFiltersTimeoutRef,
    lastAppliedFiltersRef,
  } = refs;

  const handleApplyStandardFilters = useCallback(() => {
    if (isApplyingFilters) {
      return;
    }

    const now = Date.now();
    if (now - lastFilterApplyTimeRef.current < 300) {
      return;
    }

    setIsApplyingFilters(true);

    if (multiselectTimeoutRef.current) {
      clearTimeout(multiselectTimeoutRef.current);
      multiselectTimeoutRef.current = null;
    }

    const newFilters = buildCurrentStandardFilters();
    const applyDecision = getApplicantStandardFilterApplyDecision({
      filters: newFilters,
      lastAppliedFiltersKey: lastAppliedFiltersRef.current || '',
      hasEmptyTextFilters: hasEmptyApplicantTextFilters(textFilters),
    });

    if (applyDecision.type === 'skip') {
      setIsApplyingFilters(false);
      return;
    }

    lastAppliedFiltersRef.current = applyDecision.nextLastAppliedFiltersKey;
    lastFilterApplyTimeRef.current = Date.now();
    onFilterChange(applyDecision.filters);

    const timeoutId = setTimeout(() => {
      setIsApplyingFilters(false);
    }, 50);

    if (applyingFiltersTimeoutRef.current) {
      clearTimeout(applyingFiltersTimeoutRef.current);
    }
    applyingFiltersTimeoutRef.current = timeoutId;
  }, [
    applyingFiltersTimeoutRef,
    buildCurrentStandardFilters,
    isApplyingFilters,
    lastAppliedFiltersRef,
    multiselectTimeoutRef,
    onFilterChange,
    textFilters,
  ]);

  const scheduleStandardFilterApply = useCallback((delay = 200) => {
    if (multiselectTimeoutRef.current) {
      clearTimeout(multiselectTimeoutRef.current);
      multiselectTimeoutRef.current = null;
    }

    multiselectTimeoutRef.current = setTimeout(() => handleApplyStandardFilters(), delay);
  }, [handleApplyStandardFilters, multiselectTimeoutRef]);

  const scheduleSkillFilterApply = useCallback((delay = 100) => {
    if (skillsTimeoutRef.current) {
      clearTimeout(skillsTimeoutRef.current);
    }

    skillsTimeoutRef.current = setTimeout(() => handleApplyStandardFilters(), delay);
  }, [handleApplyStandardFilters, skillsTimeoutRef]);

  return {
    handleApplyStandardFilters,
    isApplyingFilters,
    scheduleSkillFilterApply,
    scheduleStandardFilterApply,
  };
}
