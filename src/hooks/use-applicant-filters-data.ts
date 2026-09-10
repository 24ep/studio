// src/hooks/use-Applicant-filters-data.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';

interface FilterData {
  positions: Array<{
    id: string;
    title: string;
    department: string;
    isOpen: boolean;
    recruiterName: string;
  }>;
  stages: Array<{
    id: string;
    name: string;
    sort_order: number;
    color: string;
    description: string;
  }>;
  recruiters: Array<{
    id: string;
    name: string;
    email: string;
    avatarUrl: string;
    personalColor?: string;
  }>;
  sources: Array<{
    id: string;
    name: string;
    description: string;
    logo: string;
  }>;
  ApplicantCounts: Array<{
    status: string;
    count: number;
  }>;
}

interface UseApplicantFiltersDataReturn {
  filterData: FilterData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  lastUpdated: Date | null;
}

function isAbortError(error: unknown) {
  return error instanceof Error && error.name === 'AbortError';
}

function getApplicantFiltersErrorMessage(error: unknown) {
  return error instanceof Error && error.message ? error.message : 'Failed to fetch filter data';
}

export function useApplicantFiltersData(): UseApplicantFiltersDataReturn {
  const { data: session, status } = useSession();
  const [filterData, setFilterData] = useState<FilterData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);

  const fetchFilterData = useCallback(async () => {
    if (status !== 'authenticated' || !session?.user) {
      return;
    }

    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/applicants/filters', {
        signal: abortControllerRef.current.signal,
        headers: {
          'Cache-Control': 'no-cache'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json() as FilterData;

      if (isMountedRef.current) {
        setFilterData(data);
        setLastUpdated(new Date());
        setError(null);
      }
    } catch (err: unknown) {
      if (isAbortError(err)) {
        // Request was cancelled, don't set error
        return;
      }

      if (isMountedRef.current) {
        setError(getApplicantFiltersErrorMessage(err));
        console.error('Error fetching Applicant filter data:', err);
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [session, status]);

  // Initial fetch
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      fetchFilterData();
    }
  }, [fetchFilterData, status, session]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const refetch = useCallback(async () => {
    await fetchFilterData();
  }, [fetchFilterData]);

  return {
    filterData,
    isLoading,
    error,
    refetch,
    lastUpdated
  };
}
