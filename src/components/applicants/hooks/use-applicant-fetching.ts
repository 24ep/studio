import { useCallback, useRef, useEffect } from 'react';
import type { ApplicantFilterValues } from '@/components/applicants/ApplicantFilters';
import type { Applicant } from '@/lib/types';
import { safeFetch } from '@/lib/safe-fetch';
import { buildApplicantTableQuery } from '../applicant-page-utils';

interface UseApplicantFetchingProps {
  sessionStatus: string;
  serverAuthError: boolean;
  serverPermissionError: boolean;
  isClearingFilters: boolean;
  hasInitialDataFetch: boolean;
  searchParams: URLSearchParams;
  sortColumn: string;
  sortDirection: 'asc' | 'desc' | null;
  setFilteredApplicants: (applicants: Applicant[]) => void;
  setTotal: (total: number) => void;
  setTableError: (error: string | null) => void;
  setTableLoading: (loading: boolean) => void;
  setIsFetching: (fetching: boolean) => void;
  setAuthError: (error: boolean) => void;
  setPermissionError: (error: boolean) => void;
  setFetchError: (error: string | null) => void;
  setIsLoading: (loading: boolean) => void;
  getShowPinSection: () => boolean;
}

export function useApplicantFetching({
  sessionStatus,
  serverAuthError,
  serverPermissionError,
  isClearingFilters,
  hasInitialDataFetch,
  searchParams,
  sortColumn,
  sortDirection,
  setFilteredApplicants,
  setTotal,
  setTableError,
  setTableLoading,
  setIsFetching,
  setAuthError,
  setPermissionError,
  setFetchError,
  setIsLoading,
  getShowPinSection
}: UseApplicantFetchingProps) {
  const currentRequestRef = useRef<string | null>(null);
  const latestRequestIdRef = useRef<string | null>(null);

  // Cleanup all timeouts on unmount
  useEffect(() => {
    return () => {
      // Cleanup function - no timeouts to clear
    };
  }, []);

  const fetchTableData = useCallback(async (currentFilters: ApplicantFilterValues, currentPage: number, currentPageSize: number) => {
    if (sessionStatus !== 'authenticated') {
      return;
    }
    
    // Generate a unique request ID for this request using crypto when available
    const requestId = typeof crypto !== 'undefined' && crypto.randomUUID 
      ? crypto.randomUUID().replace(/-/g, '').substring(0, 13)
      : Math.random().toString(36).substring(2, 15);
    latestRequestIdRef.current = requestId;
    
    setIsFetching(true);
    setTableLoading(true);
    setTableError(null);
    
    try {
      const query = buildApplicantTableQuery({
        filters: currentFilters,
        page: currentPage,
        pageSize: currentPageSize,
        sortColumn,
        sortDirection,
        advancedQuery: searchParams.get('query'),
        showPinSection: getShowPinSection(),
      });
      
      const apiUrl = `/api/applicants?${query.toString()}`;
      
      const result = await safeFetch<{ data: Applicant[]; pagination?: { total: number } }>(apiUrl, {
        headers: {
          'Cache-Control': 'no-cache'
        },
        timeoutMs: 12000
      });
      
      if (!result.ok) {
        console.warn('Skipping failed endpoint /api/applicants:', result.error || result.status);
        setTableError(`Failed to fetch applicants: ${result.error}`);
        setFilteredApplicants([]);
        setTotal(0);
        return;
      }
      
      const data = result.data;
      
      // Check if this is still the latest request
      if (latestRequestIdRef.current !== requestId) {
        return;
      }
      
      if (data && Array.isArray(data.data)) {
        setFilteredApplicants(data.data);
        setTotal(data.pagination?.total || data.data.length);
        setTableError(null);
      } else {
        setFilteredApplicants([]);
        setTotal(0);
        setTableError('Invalid data format received from server');
        console.error('FETCH ERROR: Invalid data format:', data);
      }
    } catch (error) {
      if (latestRequestIdRef.current !== requestId) {
        return;
      }
      
      console.error('FETCH ERROR: Error fetching applicants:', error);
      setTableError((error as Error).message || 'Failed to fetch applicants');
      setFilteredApplicants([]);
      setTotal(0);
    } finally {
      if (latestRequestIdRef.current !== requestId) {
        return;
      }
      
      setTableLoading(false);
      setIsFetching(false);
    }
  }, [sessionStatus, searchParams, sortColumn, sortDirection, getShowPinSection, setIsFetching, setTableLoading, setTableError, setFilteredApplicants, setTotal]);

  // Create a debounced version for table refresh
  const debouncedFetchTableData = useCallback((currentFilters: ApplicantFilterValues, currentPage: number, currentPageSize: number) => {
    fetchTableData(currentFilters, currentPage, currentPageSize);
  }, [fetchTableData]);

  return {
    fetchTableData,
    debouncedFetchTableData,
    currentRequestRef,
    latestRequestIdRef
  };
}
