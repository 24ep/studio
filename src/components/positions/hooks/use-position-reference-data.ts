import { useCallback, useState } from 'react';
import type { Grade } from '@/lib/types';
import { safeFetch } from '@/lib/safe-fetch';
import {
  fetchPositionDepartments,
  normalizePositionRecruiterStats,
  type PositionRecruiterOption,
} from '../position-page-utils';

export function usePositionReferenceData() {
  const [allGrades, setAllGrades] = useState<Grade[]>([]);
  const [allDepartments, setAllDepartments] = useState<string[]>([]);
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(false);
  const [recruiterStats, setRecruiterStats] = useState<{ [key: string]: number }>({});
  const [availableRecruiter, setAvailableRecruiter] = useState<PositionRecruiterOption[]>([]);

  const fetchGrades = useCallback(async () => {
    try {
      const result = await safeFetch('/api/settings/grades', { timeoutMs: 5000 });
      if (result.ok) {
        setAllGrades(result.data as Grade[]);
      }
    } catch (error) {
      console.error('Failed to fetch grades:', error);
    }
  }, []);

  const fetchRecruiterStats = useCallback(async () => {
    try {
      const result = await safeFetch('/api/users/recruiter-headcount-stats', { timeoutMs: 8000 });

      if (!result.ok) {
        console.warn('Skipping failed endpoint /api/users/recruiter-headcount-stats:', result.error || result.status);
        setAvailableRecruiter([]);
        return;
      }

      const { availableRecruiters, stats } = normalizePositionRecruiterStats(result.data);
      setAvailableRecruiter(availableRecruiters);
      setRecruiterStats(stats);
    } catch {
      // Preserve the previous quiet failure behavior for recruiter statistics.
    }
  }, []);

  const fetchAllDepartments = useCallback(async () => {
    setIsLoadingDepartments(true);
    try {
      setAllDepartments(await fetchPositionDepartments(safeFetch));
    } catch {
      setAllDepartments([]);
    } finally {
      setIsLoadingDepartments(false);
    }
  }, []);

  const resetReferenceLoading = useCallback(() => {
    setIsLoadingDepartments(false);
  }, []);

  return {
    allDepartments,
    allGrades,
    availableRecruiter,
    fetchAllDepartments,
    fetchGrades,
    fetchRecruiterStats,
    isLoadingDepartments,
    recruiterStats,
    resetReferenceLoading,
  };
}
