import { useCallback, useEffect } from 'react';

import type { ApplicantFilterValues } from '@/lib/types';
import { getApplicantFilterAutoApplyDecision } from '../applicant-filter-query-utils';
import type {
  ApplicantFilterApplyRefs,
  ApplicantFilterTextFilters,
  BuildCurrentStandardFilters,
} from './use-applicant-filter-apply-types';
import { useApplicantPositionFilterApply } from './use-applicant-position-filter-apply';
import { useApplicantStandardFilterApply } from './use-applicant-standard-filter-apply';

type ApplicantFilterApplyActionsInput = {
  autoApply: boolean;
  advancedQueryInput: string;
  filterStateSignal: unknown;
  textFilters: ApplicantFilterTextFilters;
  refs: ApplicantFilterApplyRefs;
  buildCurrentStandardFilters: BuildCurrentStandardFilters;
  onFilterChange: (filters: ApplicantFilterValues) => void;
  setSelectedPositionIds: (value: Set<string>) => void;
  setSelectedStatuses: (value: Set<string>) => void;
  setSelectedRecruiterIds: (value: Set<string>) => void;
  setSelectedSourceIds: (value: Set<string>) => void;
  setExperienceYearsRange: (value: [number, number]) => void;
};

export function useApplicantFilterApplyActions({
  autoApply,
  advancedQueryInput,
  filterStateSignal,
  textFilters,
  refs,
  buildCurrentStandardFilters,
  onFilterChange,
  setSelectedPositionIds,
  setSelectedStatuses,
  setSelectedRecruiterIds,
  setSelectedSourceIds,
  setExperienceYearsRange,
}: ApplicantFilterApplyActionsInput) {
  const {
    autoApplyTimeoutRef,
    isInitialLoadRef,
    isSyncingFromInitialFiltersRef,
    isComponentInitializedRef,
  } = refs;

  const {
    handleApplyStandardFilters,
    isApplyingFilters,
    scheduleSkillFilterApply,
    scheduleStandardFilterApply,
  } = useApplicantStandardFilterApply({
    buildCurrentStandardFilters,
    onFilterChange,
    refs,
    textFilters,
  });

  const {
    handlePositionChange,
    isHandlingPositionChangeRef,
  } = useApplicantPositionFilterApply({
    buildCurrentStandardFilters,
    onFilterChange,
    refs,
    setSelectedPositionIds,
  });

  useEffect(() => {
    const autoApplyDecision = getApplicantFilterAutoApplyDecision({
      isInitialLoad: Boolean(isInitialLoadRef.current),
      isSyncingFromInitialFilters: Boolean(isSyncingFromInitialFiltersRef.current),
      isComponentInitialized: Boolean(isComponentInitializedRef.current),
      isHandlingPositionChange: isHandlingPositionChangeRef.current,
      isApplyingFilters,
      advancedQueryInput,
      autoApply,
    });

    if (autoApplyDecision.type === 'skip') {
      return;
    }

    if (autoApplyTimeoutRef.current) {
      clearTimeout(autoApplyTimeoutRef.current);
    }

    autoApplyTimeoutRef.current = setTimeout(() => {
      handleApplyStandardFilters();
    }, autoApplyDecision.delayMs);

    return () => {
      if (autoApplyTimeoutRef.current) {
        clearTimeout(autoApplyTimeoutRef.current);
        autoApplyTimeoutRef.current = null;
      }
    };
  }, [
    advancedQueryInput,
    autoApply,
    autoApplyTimeoutRef,
    filterStateSignal,
    handleApplyStandardFilters,
    isApplyingFilters,
    isComponentInitializedRef,
    isInitialLoadRef,
    isSyncingFromInitialFiltersRef,
  ]);

  const handleStatusChange = useCallback((newSelectedStatuses: Set<string>) => {
    setSelectedStatuses(newSelectedStatuses);
    scheduleStandardFilterApply();
  }, [scheduleStandardFilterApply, setSelectedStatuses]);

  const handleRecruiterChange = useCallback((newSelectedRecruiterIds: Set<string>) => {
    setSelectedRecruiterIds(newSelectedRecruiterIds);
    scheduleStandardFilterApply();
  }, [scheduleStandardFilterApply, setSelectedRecruiterIds]);

  const handleSourceChange = useCallback((newSelectedSourceIds: Set<string>) => {
    setSelectedSourceIds(newSelectedSourceIds);
    scheduleStandardFilterApply();
  }, [scheduleStandardFilterApply, setSelectedSourceIds]);

  const handleExperienceYearsChange = useCallback((newRange: [number, number]) => {
    setExperienceYearsRange(newRange);
    scheduleStandardFilterApply();
  }, [scheduleStandardFilterApply, setExperienceYearsRange]);

  const handleNoExperienceToggle = useCallback((checked: boolean) => {
    setExperienceYearsRange(checked ? [-1, 50] : [0, 50]);
    if (autoApplyTimeoutRef.current) {
      clearTimeout(autoApplyTimeoutRef.current);
    }
    autoApplyTimeoutRef.current = setTimeout(() => handleApplyStandardFilters(), 100);
  }, [autoApplyTimeoutRef, handleApplyStandardFilters, setExperienceYearsRange]);

  return {
    isApplyingFilters,
    handleApplyStandardFilters,
    scheduleStandardFilterApply,
    scheduleSkillFilterApply,
    handlePositionChange,
    handleStatusChange,
    handleRecruiterChange,
    handleSourceChange,
    handleExperienceYearsChange,
    handleNoExperienceToggle,
  };
}
