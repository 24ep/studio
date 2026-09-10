import { useEffect, useRef, type Dispatch, type SetStateAction } from 'react';
import type { PositionsPreferences } from '@/hooks/use-user-preferences';
import {
  getChangedPositionPreferences,
  getPositionPreferencesInitialization,
  shouldInitializePositionPreferences,
  type PositionPreferencesLike,
  type PositionPreferencesSnapshot,
  type PositionStatusFilter,
} from '../position-page-utils';

interface UsePositionPreferencesSyncOptions {
  isLoaded: boolean;
  preferences: PositionPreferencesLike;
  currentPreferences: PositionPreferencesSnapshot;
  setSearchTerm: Dispatch<SetStateAction<string>>;
  setDepartmentFilter: Dispatch<SetStateAction<string>>;
  setPageSize: Dispatch<SetStateAction<number>>;
  setSelectedRecruiterId: Dispatch<SetStateAction<string | null>>;
  setStatusFilter: Dispatch<SetStateAction<PositionStatusFilter>>;
  updatePositionsPreferences: (updates: Partial<PositionsPreferences>) => void;
}

export function usePositionPreferencesSync({
  isLoaded,
  preferences,
  currentPreferences,
  setSearchTerm,
  setDepartmentFilter,
  setPageSize,
  setSelectedRecruiterId,
  setStatusFilter,
  updatePositionsPreferences,
}: UsePositionPreferencesSyncOptions) {
  const shouldUpdatePreferencesRef = useRef(true);
  const hasInitializedFromPreferencesRef = useRef(false);
  const preferencesTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedPreferencesRef = useRef<PositionPreferencesSnapshot>({
    searchTerm: '',
    departmentFilter: 'all',
    statusFilter: 'all',
    selectedRecruiterId: null,
    pageSize: 20,
  });

  useEffect(() => {
    if (!shouldInitializePositionPreferences(isLoaded, hasInitializedFromPreferencesRef.current)) {
      return;
    }

    hasInitializedFromPreferencesRef.current = true;
    shouldUpdatePreferencesRef.current = false;

    const {
      preferences: initialPreferences,
      shouldApplyStatusFilter,
    } = getPositionPreferencesInitialization(
      preferences,
      typeof window !== 'undefined' ? window.location.search : ''
    );

    setSearchTerm(initialPreferences.searchTerm);
    setDepartmentFilter(initialPreferences.departmentFilter);
    setPageSize(initialPreferences.pageSize);
    setSelectedRecruiterId(initialPreferences.selectedRecruiterId);
    lastSavedPreferencesRef.current = initialPreferences;

    if (shouldApplyStatusFilter) {
      setStatusFilter(initialPreferences.statusFilter);
    }

    if (preferencesTimeoutRef.current) {
      clearTimeout(preferencesTimeoutRef.current);
    }

    preferencesTimeoutRef.current = setTimeout(() => {
      shouldUpdatePreferencesRef.current = true;
    }, 500);
  }, [
    isLoaded,
    preferences,
    setSearchTerm,
    setDepartmentFilter,
    setPageSize,
    setSelectedRecruiterId,
    setStatusFilter,
  ]);

  useEffect(() => {
    if (!isLoaded || !shouldUpdatePreferencesRef.current || !hasInitializedFromPreferencesRef.current) {
      return;
    }

    const nextPreferences = getChangedPositionPreferences(
      currentPreferences,
      lastSavedPreferencesRef.current
    );

    if (nextPreferences) {
      lastSavedPreferencesRef.current = nextPreferences;
      updatePositionsPreferences(nextPreferences);
    }
  }, [currentPreferences, isLoaded, updatePositionsPreferences]);

  useEffect(() => {
    return () => {
      if (preferencesTimeoutRef.current) {
        clearTimeout(preferencesTimeoutRef.current);
      }
    };
  }, []);
}
