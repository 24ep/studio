"use client";

import { useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  buildApplicantPageSettingsViewState,
  buildInitialApplicantFiltersFromSearchParams,
  getApplicantAdvancedQueryParam,
} from '../applicant-page-utils';
import type { ApplicantsPageClientProps } from '../ApplicantsPageClientTypes';
import { useApplicantSettings } from '@/hooks/use-applicant-settings';
import { useApplicantFiltersData } from '@/hooks/use-applicant-filters-data';
import { useApplicantFilters } from './use-applicant-filters';
import { useApplicantsGlobalSearch } from './use-applicants-global-search';
import { useApplicantsPageSessionGate } from './use-applicants-page-session-gate';

type ApplicantSearchParams = ReturnType<typeof useSearchParams>;

export function useApplicantsPageRoutingSession() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: session, status: sessionStatus } = useSession();
  const sessionGateMessage = useApplicantsPageSessionGate({
    sessionStatus,
    replaceUrl: router.replace,
  });

  return {
    router,
    pathname,
    searchParams,
    session,
    sessionStatus,
    sessionGateMessage,
  };
}

export function useApplicantsPageSettingsState() {
  const {
    settings: applicantSettings,
    setSettings: setApplicantSettings,
    isLoading: settingsLoading,
    error: settingsError,
    clearError: clearSettingsError,
  } = useApplicantSettings();

  return {
    applicantSettings,
    setApplicantSettings,
    settingsLoading,
    settingsError,
    clearSettingsError,
    ...buildApplicantPageSettingsViewState(applicantSettings, settingsLoading),
  };
}

export function useApplicantsPageFilterState(
  initialFilters: ApplicantsPageClientProps['initialFilters'],
  searchParams: ApplicantSearchParams
) {
  const advancedQuery = getApplicantAdvancedQueryParam(searchParams);
  const computedInitialFilters = useMemo(
    () => buildInitialApplicantFiltersFromSearchParams(initialFilters, searchParams),
    [initialFilters, searchParams]
  );

  const filterState = useApplicantFilters(computedInitialFilters);
  useApplicantsGlobalSearch(filterState.handleFilterChange);

  const { filterData, isLoading: isFilterDataLoading } = useApplicantFiltersData();

  return {
    ...filterState,
    advancedQuery,
    filters: filterState.filters || {},
    filterData,
    isFilterDataLoading,
  };
}
