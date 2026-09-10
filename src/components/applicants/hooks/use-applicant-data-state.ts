import { useRef, useState } from 'react';

import type { Applicant } from '@/lib/types';

interface UseApplicantDataStateOptions {
  initialFetchError?: string;
  serverAuthError: boolean;
  serverPermissionError: boolean;
}

export function useApplicantDataState({
  initialFetchError,
  serverAuthError,
  serverPermissionError,
}: UseApplicantDataStateOptions) {
  const [filteredApplicants, setFilteredApplicants] = useState<Applicant[]>([]);
  const [allApplicantsForCounts, setAllApplicantsForCounts] = useState<Applicant[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [hasInitialFetch, setHasInitialFetch] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(initialFetchError || null);
  const [authError, setAuthError] = useState(serverAuthError);
  const [permissionError, setPermissionError] = useState(serverPermissionError);
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentRequestRef = useRef<string | null>(null);
  const latestRequestIdRef = useRef<string | null>(null);

  return {
    allApplicantsForCounts,
    authError,
    currentRequestRef,
    fetchError,
    fetchTimeoutRef,
    filteredApplicants,
    hasInitialFetch,
    isFetching,
    isLoading,
    latestRequestIdRef,
    permissionError,
    setAllApplicantsForCounts,
    setAuthError,
    setFetchError,
    setFilteredApplicants,
    setHasInitialFetch,
    setIsFetching,
    setIsLoading,
    setPermissionError,
  };
}
