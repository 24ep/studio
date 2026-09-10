import { useCallback, type Dispatch, type SetStateAction } from 'react';

import type { Applicant } from '@/lib/types';
import { fetchApplicantDataForCounts } from './applicant-data-utils';

interface UseApplicantCountsLoaderOptions {
  sessionStatus: string;
  setAllApplicantsForCounts: Dispatch<SetStateAction<Applicant[]>>;
  setIsLoading: (isLoading: boolean) => void;
}

export function useApplicantCountsLoader({
  sessionStatus,
  setAllApplicantsForCounts,
  setIsLoading,
}: UseApplicantCountsLoaderOptions) {
  return useCallback(async () => {
    if (sessionStatus !== 'authenticated') return;

    try {
      setIsLoading(true);
      const applicants = await fetchApplicantDataForCounts();

      if (applicants) {
        setAllApplicantsForCounts(applicants);
      } else {
        console.warn('Skipping failed endpoint /api/applicants (counts)');
      }
    } catch (error) {
      console.error('Error fetching all applicants for counts:', error);
    } finally {
      setIsLoading(false);
    }
  }, [sessionStatus, setAllApplicantsForCounts, setIsLoading]);
}
