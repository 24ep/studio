import { useEffect, type Dispatch, type SetStateAction } from 'react';

import type { Applicant } from '@/lib/types';
import { getSafeInitialApplicants } from './applicant-data-state-utils';

interface UseApplicantDataInitialEffectsOptions {
  fetchAllApplicantsForCounts: () => Promise<void>;
  fetchFitScoreCounts: () => void | Promise<void>;
  initialApplicants: Applicant[];
  sessionStatus: string;
  setAllApplicantsForCounts: Dispatch<SetStateAction<Applicant[]>>;
  setFilteredApplicants: Dispatch<SetStateAction<Applicant[]>>;
  setHasInitialFetch: (hasInitialFetch: boolean) => void;
}

export function useApplicantDataInitialEffects({
  fetchAllApplicantsForCounts,
  fetchFitScoreCounts,
  initialApplicants,
  sessionStatus,
  setAllApplicantsForCounts,
  setFilteredApplicants,
  setHasInitialFetch,
}: UseApplicantDataInitialEffectsOptions) {
  useEffect(() => {
    const safeInitialApplicants = getSafeInitialApplicants(initialApplicants);

    if (safeInitialApplicants.length > 0) {
      setFilteredApplicants(safeInitialApplicants);
      setAllApplicantsForCounts(safeInitialApplicants);
      setHasInitialFetch(true);
    }
  }, [initialApplicants, setAllApplicantsForCounts, setFilteredApplicants, setHasInitialFetch]);

  useEffect(() => {
    const safeInitialApplicants = getSafeInitialApplicants(initialApplicants);
    if (sessionStatus === 'authenticated' && safeInitialApplicants.length === 0) {
      const timeoutId = setTimeout(() => {
        fetchAllApplicantsForCounts();
      }, 200);

      return () => clearTimeout(timeoutId);
    }
  }, [sessionStatus, initialApplicants, fetchAllApplicantsForCounts]);

  useEffect(() => {
    if (sessionStatus === 'authenticated') {
      const timeoutId = setTimeout(() => {
        fetchFitScoreCounts();
      }, 300);

      return () => clearTimeout(timeoutId);
    }
  }, [sessionStatus, fetchFitScoreCounts]);
}
