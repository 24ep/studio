import { useCallback, useEffect, useState } from 'react';
import type { Applicant, ApplicantFilterValues } from '@/lib/types';
import { safeFetch } from '@/lib/safe-fetch';
import { buildPinnedApplicantsQuery } from '../applicant-page-utils';

interface UseApplicantPinnedListInput {
  filters: ApplicantFilterValues;
  hasInitialDataFetch: boolean;
  isClearingFilters: boolean;
}

export function useApplicantPinnedList({
  filters,
  hasInitialDataFetch,
  isClearingFilters,
}: UseApplicantPinnedListInput) {
  const [allPinnedApplicants, setAllPinnedApplicants] = useState<Applicant[]>([]);

  const fetchAllPinnedApplicants = useCallback(async () => {
    try {
      const query = buildPinnedApplicantsQuery(filters);
      const apiUrl = `/api/applicants?${query.toString()}`;

      const result = await safeFetch<Applicant[]>(apiUrl, {
        headers: {
          'Cache-Control': 'no-cache',
        },
        timeoutMs: 10000,
      });

      if (result.ok && result.data) {
        setAllPinnedApplicants(result.data);
      }
    } catch (error) {
      console.error('Error fetching pinned Applicants:', error);
      setAllPinnedApplicants([]);
    }
  }, [filters]);

  useEffect(() => {
    if (hasInitialDataFetch && !isClearingFilters) {
      fetchAllPinnedApplicants();
    }
  }, [fetchAllPinnedApplicants, hasInitialDataFetch, isClearingFilters]);

  return {
    allPinnedApplicants,
    fetchAllPinnedApplicants,
  };
}
