"use client";

import { useEffect, useMemo, useRef, type ComponentProps } from 'react';

import { useIsMobile } from '@/hooks/use-mobile';
import type { ApplicantFilterValues, ApplicantSource, Position, RecruitmentStage, UserProfile } from '@/lib/types';

import { ApplicantFiltersView } from '../ApplicantFiltersView';
import { buildApplicantFiltersDesktopProps } from './applicant-filters-desktop-view-props';
import { buildApplicantFiltersMobileContentProps } from './applicant-filters-mobile-view-props';
import { useApplicantAdvancedQuery } from './use-applicant-advanced-query';
import { useApplicantFilterApplyActions } from './use-applicant-filter-apply-actions';
import { useApplicantFilterOptions } from './use-applicant-filter-options';
import { useApplicantFilterSyncEffects } from './use-applicant-filter-sync-effects';
import { useApplicantFilterTimeoutRefs } from './use-applicant-filter-timeout-refs';
import { useApplicantStandardFilterState } from './use-applicant-standard-filter-state';
import { useApplicantFiltersControllerDerivedState } from './use-applicant-filters-controller-derived-state';

export interface UseApplicantFiltersControllerOptions {
  initialFilters?: ApplicantFilterValues;
  onFilterChange: (filters: ApplicantFilterValues) => void;
  onAiSearch: (query: string) => void;
  onCancelAiSearch?: () => void;
  onClearAllFilters: () => void;
  availablePositions: Position[];
  availableStages: RecruitmentStage[];
  availableRecruiter: Pick<UserProfile, 'id' | 'name'>[];
  availableSources: ApplicantSource[];
  isLoading?: boolean;
  isAiSearching?: boolean;
  advancedQuery?: string;
  autoApply?: boolean;
  showActionButtons?: boolean;
  className?: string;
}

export function useApplicantFiltersController({
  initialFilters = {},
  onFilterChange,
  onAiSearch,
  onCancelAiSearch,
  onClearAllFilters,
  availablePositions,
  availableStages,
  availableRecruiter,
  availableSources,
  isLoading,
  isAiSearching,
  advancedQuery,
  autoApply = true,
  showActionButtons = false,
  className,
}: UseApplicantFiltersControllerOptions): ComponentProps<typeof ApplicantFiltersView> {
  const isMobile = useIsMobile();
  const {
    multiselectTimeoutRef,
    autoApplyTimeoutRef,
    skillsTimeoutRef,
    initializationTimeoutRef,
    syncingTimeoutRef,
    applyingFiltersTimeoutRef,
    positionChangeTimeoutRef,
    urlFiltersTimeoutRef,
  } = useApplicantFilterTimeoutRefs();
  const isInitialLoadRef = useRef(true);
  const isSyncingFromInitialFiltersRef = useRef(false);
  const lastAppliedUrlFiltersRef = useRef<string | null>(null);
  const isComponentInitializedRef = useRef(false);
  const lastAppliedFiltersRef = useRef('');
  const onFilterChangeRef = useRef(onFilterChange);

  useEffect(() => {
    onFilterChangeRef.current = onFilterChange;
  }, [onFilterChange]);

  const standard = useApplicantStandardFilterState({
    initialFilters,
    onClearAllFilters,
  });
  const options = useApplicantFilterOptions({
    availablePositions,
    availableStages,
    availableRecruiter,
    availableSources,
  });
  const advanced = useApplicantAdvancedQuery({
    advancedQuery,
    onClearAllFilters,
    onFilterChangeRef,
    syncAdvancedQueryFiltersToState: standard.syncAdvancedQueryFiltersToState,
  });

  const {
    currentFilterSyncState,
    filterStateSignal,
    filterSyncSetters,
  } = useApplicantFiltersControllerDerivedState(standard);

  useApplicantFilterSyncEffects({
    initialFilters,
    onFilterChange,
    advancedQuery,
    activeTab: advanced.activeTab,
    advancedQueryInput: advanced.advancedQueryInput,
    isTypingName: standard.isTypingName,
    isTypingLocation: standard.isTypingLocation,
    currentState: currentFilterSyncState,
    setters: filterSyncSetters,
    isInitialLoadRef,
    isSyncingFromInitialFiltersRef,
    lastAppliedUrlFiltersRef,
    isComponentInitializedRef,
    initializationTimeoutRef,
    syncingTimeoutRef,
    urlFiltersTimeoutRef,
    processedAdvancedQueryRef: advanced.processedAdvancedQueryRef,
    setActiveTab: advanced.setActiveTab,
    setAdvancedQueryInput: advanced.setAdvancedQueryInput,
  });

  const applyActions = useApplicantFilterApplyActions({
    autoApply,
    advancedQueryInput: advanced.advancedQueryInput,
    filterStateSignal,
    textFilters: {
      name: standard.name,
      email: standard.email,
      phone: standard.phone,
      location: standard.location,
    },
    refs: {
      multiselectTimeoutRef,
      autoApplyTimeoutRef,
      skillsTimeoutRef,
      applyingFiltersTimeoutRef,
      positionChangeTimeoutRef,
      isInitialLoadRef,
      isSyncingFromInitialFiltersRef,
      isComponentInitializedRef,
      lastAppliedFiltersRef,
    },
    buildCurrentStandardFilters: standard.buildCurrentStandardFilters,
    onFilterChange: filters => onFilterChangeRef.current(filters),
    setSelectedPositionIds: standard.setSelectedPositionIds,
    setSelectedStatuses: standard.setSelectedStatuses,
    setSelectedRecruiterIds: standard.setSelectedRecruiterIds,
    setSelectedSourceIds: standard.setSelectedSourceIds,
    setExperienceYearsRange: standard.setExperienceYearsRange,
  });

  const hasActiveFilters = useMemo(
    () => standard.getHasActiveFilters(advanced.advancedQueryInput),
    [advanced.advancedQueryInput, standard]
  );

  const commonProps = {
    activeTab: advanced.activeTab,
    className,
    isMobile,
    showActionButtons,
    isAdvancedQuerySyntaxModalOpen: advanced.isAdvancedQuerySyntaxModalOpen,
    onAdvancedSyntaxOpenChange: advanced.setIsAdvancedQuerySyntaxModalOpen,
    onTabChange: advanced.setActiveTab,
    onApplyStandardFilters: () => applyActions.handleApplyStandardFilters(),
    onClearAllFilters,
  };

  if (isMobile) {
    return {
      ...commonProps,
      mobileContentProps: buildApplicantFiltersMobileContentProps({
        advanced,
        advancedQuery,
        applyActions,
        className,
        hasActiveFilters,
        options,
        standard,
      }),
    };
  }

  return {
    ...commonProps,
    ...buildApplicantFiltersDesktopProps({
      advanced,
      advancedQuery,
      applyActions,
      availableSources,
      isAiSearching,
      isLoading,
      onAiSearch,
      onCancelAiSearch,
      options,
      standard,
    }),
  };
}
