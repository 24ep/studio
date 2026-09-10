import { useEffect, type MutableRefObject } from 'react';
import type { DateRange } from 'react-day-picker';
import type { ApplicantCustomFieldFilterValue, ApplicantFilterValues } from '@/lib/types';
import type { ApplicantFilterTab } from '../ApplicantFilterTabs';
import {
  areApplicantFilterSnapshotsEqual,
  applyApplicantFilterSyncState,
  buildApplicantFilterSyncState,
  hasApplicantUrlFilterValues,
  type ApplicantFilterSyncStateSetters,
} from '../applicant-filter-query-utils';

interface UseApplicantFilterSyncEffectsOptions {
  initialFilters: ApplicantFilterValues;
  onFilterChange: (filters: ApplicantFilterValues) => void;
  advancedQuery?: string;
  activeTab: ApplicantFilterTab;
  advancedQueryInput: string;
  isTypingName: boolean;
  isTypingLocation: boolean;
  currentState: {
    name: string;
    email: string;
    phone: string;
    selectedPositionIds: Set<string>;
    selectedStatuses: Set<string>;
    selectedSourceIds: Set<string>;
    skills: Set<string>;
    location: string;
    locationOperator: ApplicantFilterValues['locationOperator'];
    experienceYearsRange: [number, number];
    applicationDateRange?: DateRange;
    selectedRecruiterIds: Set<string>;
    customFieldFilters: Record<string, ApplicantCustomFieldFilterValue>;
  };
  setters: ApplicantFilterSyncStateSetters;
  isInitialLoadRef: MutableRefObject<boolean>;
  isSyncingFromInitialFiltersRef: MutableRefObject<boolean>;
  lastAppliedUrlFiltersRef: MutableRefObject<string | null>;
  isComponentInitializedRef: MutableRefObject<boolean>;
  initializationTimeoutRef: MutableRefObject<NodeJS.Timeout | null>;
  syncingTimeoutRef: MutableRefObject<NodeJS.Timeout | null>;
  urlFiltersTimeoutRef: MutableRefObject<NodeJS.Timeout | null>;
  processedAdvancedQueryRef: MutableRefObject<string>;
  setActiveTab: (tab: ApplicantFilterTab) => void;
  setAdvancedQueryInput: (query: string) => void;
}

export function useApplicantFilterSyncEffects({
  initialFilters,
  onFilterChange,
  advancedQuery,
  activeTab,
  advancedQueryInput,
  isTypingName,
  isTypingLocation,
  currentState,
  setters,
  isInitialLoadRef,
  isSyncingFromInitialFiltersRef,
  lastAppliedUrlFiltersRef,
  isComponentInitializedRef,
  initializationTimeoutRef,
  syncingTimeoutRef,
  urlFiltersTimeoutRef,
  processedAdvancedQueryRef,
  setActiveTab,
  setAdvancedQueryInput,
}: UseApplicantFilterSyncEffectsOptions) {
  useEffect(() => {
    isComponentInitializedRef.current = true;
    isInitialLoadRef.current = false;
  }, [isComponentInitializedRef, isInitialLoadRef]);

  useEffect(() => {
    if (!isInitialLoadRef.current) {
      return;
    }

    const syncState = buildApplicantFilterSyncState(initialFilters);
    applyApplicantFilterSyncState({
      syncState,
      setters,
      isTypingName,
      isTypingLocation,
    });
    isInitialLoadRef.current = false;

    if (initializationTimeoutRef.current) {
      clearTimeout(initializationTimeoutRef.current);
    }
    initializationTimeoutRef.current = setTimeout(() => {
      isComponentInitializedRef.current = true;
    }, 50);
  }, [
    initialFilters,
    initializationTimeoutRef,
    isComponentInitializedRef,
    isInitialLoadRef,
    isTypingLocation,
    isTypingName,
    setters,
  ]);

  useEffect(() => {
    if (isInitialLoadRef.current || !isComponentInitializedRef.current) {
      return;
    }

    if (areApplicantFilterSnapshotsEqual(currentState, initialFilters)) {
      return;
    }

    isSyncingFromInitialFiltersRef.current = true;
    const syncState = buildApplicantFilterSyncState(initialFilters);

    applyApplicantFilterSyncState({
      syncState,
      setters,
      currentState: {
        selectedPositionIds: currentState.selectedPositionIds,
        selectedStatuses: currentState.selectedStatuses,
        selectedSourceIds: currentState.selectedSourceIds,
        skills: currentState.skills,
        experienceYearsRange: currentState.experienceYearsRange,
        selectedRecruiterIds: currentState.selectedRecruiterIds,
      },
      isTypingName,
      isTypingLocation,
    });

    if (!advancedQuery && !processedAdvancedQueryRef.current) {
      setAdvancedQueryInput('');
      if (activeTab !== 'advanced' || !advancedQueryInput.trim()) {
        setActiveTab('filters');
      }
    }

    if (syncingTimeoutRef.current) {
      clearTimeout(syncingTimeoutRef.current);
    }
    syncingTimeoutRef.current = setTimeout(() => {
      isSyncingFromInitialFiltersRef.current = false;
    }, 50);
  }, [
    activeTab,
    advancedQuery,
    advancedQueryInput,
    currentState,
    initialFilters,
    isComponentInitializedRef,
    isInitialLoadRef,
    isSyncingFromInitialFiltersRef,
    isTypingLocation,
    isTypingName,
    processedAdvancedQueryRef,
    setActiveTab,
    setAdvancedQueryInput,
    setters,
    syncingTimeoutRef,
  ]);

  useEffect(() => {
    if (!isInitialLoadRef.current) {
      return;
    }

    if (!hasApplicantUrlFilterValues(initialFilters)) {
      return;
    }

    if (urlFiltersTimeoutRef.current) {
      clearTimeout(urlFiltersTimeoutRef.current);
      urlFiltersTimeoutRef.current = null;
    }

    urlFiltersTimeoutRef.current = setTimeout(() => {
      const payloadKey = JSON.stringify(initialFilters);
      if (lastAppliedUrlFiltersRef.current !== payloadKey) {
        lastAppliedUrlFiltersRef.current = payloadKey;
        onFilterChange(initialFilters);
      }
      urlFiltersTimeoutRef.current = null;
    }, 100);

    return () => {
      if (urlFiltersTimeoutRef.current) {
        clearTimeout(urlFiltersTimeoutRef.current);
        urlFiltersTimeoutRef.current = null;
      }
    };
  }, [
    initialFilters,
    isInitialLoadRef,
    lastAppliedUrlFiltersRef,
    onFilterChange,
    urlFiltersTimeoutRef,
  ]);
}
