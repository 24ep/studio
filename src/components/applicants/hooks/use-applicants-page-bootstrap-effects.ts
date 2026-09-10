import { useEffect } from 'react';

import {
  getApplicantInitialFetchAction,
  getApplicantInitialLoadingState,
} from '../applicant-page-utils';
import type { UseApplicantsPageEffectsInput } from './use-applicants-page-effects-types';

export function useApplicantsPageBootstrapEffects({
  sessionStatus,
  serverAuthError,
  serverPermissionError,
  initialApplicantsCount,
  filteredApplicantsCount,
  initialFetchError,
  filters,
  page,
  pageSize,
  settingsLoading,
  hasInitialDataFetch,
  sidebarFilterRef,
  setHasInitialDataFetch,
  setIsLoading,
  setTableLoading,
  fetchRecruiter,
  fetchSources,
  fetchTableData,
  fetchAllApplicantsForCounts,
  addFilterRef,
  removeFilterRef,
}: UseApplicantsPageEffectsInput) {
  useEffect(() => {
    const filterElement = sidebarFilterRef.current;
    if (filterElement) {
      addFilterRef(filterElement);
    }

    return () => {
      if (filterElement) {
        removeFilterRef(filterElement);
      }
    };
  }, [addFilterRef, removeFilterRef, sidebarFilterRef]);

  useEffect(() => {
    const loadingState = getApplicantInitialLoadingState({
      sessionStatus,
      initialApplicantsCount,
      filteredApplicantsCount,
      hasInitialFetchError: Boolean(initialFetchError),
      serverAuthError,
      serverPermissionError,
    });

    setIsLoading(loadingState.isLoading);
    if (loadingState.shouldClearTableLoading) {
      setTableLoading(false);
    }

    if (loadingState.shouldFetchReferenceData) {
      const timeoutId = setTimeout(() => {
        fetchRecruiter();
        fetchSources();
      }, 1000);

      return () => clearTimeout(timeoutId);
    }
  }, [
    sessionStatus,
    serverAuthError,
    serverPermissionError,
    fetchRecruiter,
    fetchSources,
    initialFetchError,
    initialApplicantsCount,
    filteredApplicantsCount,
    setIsLoading,
    setTableLoading,
  ]);

  useEffect(() => {
    const initialFetchAction = getApplicantInitialFetchAction({
      sessionStatus,
      serverAuthError,
      serverPermissionError,
      hasInitialDataFetch,
      initialApplicantsCount,
      settingsLoading,
    });

    if (initialFetchAction === 'fetch-client-data') {
      setHasInitialDataFetch(true);
      setIsLoading(true);
      setTableLoading(true);

      fetchTableData(filters, page, pageSize);
      fetchAllApplicantsForCounts();
    } else if (initialFetchAction === 'use-initial-data') {
      setHasInitialDataFetch(true);
      setIsLoading(false);
      setTableLoading(false);
    }
  }, [
    sessionStatus,
    serverAuthError,
    serverPermissionError,
    hasInitialDataFetch,
    fetchTableData,
    fetchAllApplicantsForCounts,
    initialApplicantsCount,
    filters,
    page,
    pageSize,
    settingsLoading,
    setHasInitialDataFetch,
    setIsLoading,
    setTableLoading,
  ]);
}
