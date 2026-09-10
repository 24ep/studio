import { useEffect } from 'react';

import { safeFetch } from '@/lib/safe-fetch';

import {
  calculateVacantOpenPositionStats,
  normalizeHiringManagers,
  shouldStartInitialPositionLoad,
} from '../position-page-utils';
import type { UsePositionsPageEffectsInput } from './use-positions-page-effects-types';

type ReferenceEffectsInput = Pick<
  UsePositionsPageEffectsInput,
  | 'fetchAllDepartments'
  | 'fetchGrades'
  | 'fetchPositionsRef'
  | 'fetchRecruiterStats'
  | 'hasInitialLoadRef'
  | 'headcountData'
  | 'isPreferencesLoaded'
  | 'positions'
  | 'sessionUserId'
  | 'setAvailableHiringManagers'
  | 'setVacantFromOpenPositions'
>;

export function usePositionsPageReferenceEffects({
  fetchAllDepartments,
  fetchGrades,
  fetchPositionsRef,
  fetchRecruiterStats,
  hasInitialLoadRef,
  headcountData,
  isPreferencesLoaded,
  positions,
  sessionUserId,
  setAvailableHiringManagers,
  setVacantFromOpenPositions,
}: ReferenceEffectsInput) {
  useEffect(() => {
    const fetchHiringManagers = async () => {
      try {
        const result = await safeFetch('/api/users?role=Hiring Manager&pageSize=100', { timeoutMs: 8000 });
        if (result.ok) {
          setAvailableHiringManagers(normalizeHiringManagers(result.data));
        }
      } catch (error) {
        console.error('Failed to fetch hiring managers:', error);
      }
    };

    if (sessionUserId) {
      fetchHiringManagers();
    }
  }, [sessionUserId, setAvailableHiringManagers]);

  useEffect(() => {
    setVacantFromOpenPositions(calculateVacantOpenPositionStats(positions, headcountData));
  }, [headcountData, positions, setVacantFromOpenPositions]);

  useEffect(() => {
    if (!shouldStartInitialPositionLoad({
      hasInitialLoad: hasInitialLoadRef.current,
      sessionUserId,
      isPreferencesLoaded,
    })) {
      return;
    }

    hasInitialLoadRef.current = true;

    const fetchFn = fetchPositionsRef.current;
    if (fetchFn) {
      fetchFn(false);
    }
    fetchAllDepartments();
    fetchRecruiterStats();
    fetchGrades();
  }, [fetchAllDepartments, fetchGrades, fetchPositionsRef, fetchRecruiterStats, hasInitialLoadRef, isPreferencesLoaded, sessionUserId]);
}
