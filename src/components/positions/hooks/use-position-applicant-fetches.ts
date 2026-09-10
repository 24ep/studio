"use client";

import { useCallback, type Dispatch, type SetStateAction } from 'react';

import type { Applicant, ApplicantFilterValues } from '@/lib/types';
import {
  fetchPositionApplicantsPage,
  fetchPotentialPositionApplicantsPage,
} from '../position-detail-drawer-utils';
import { useDebouncedPositionApplicantFetch } from './use-debounced-position-applicant-fetch';

interface UsePositionApplicantFetchesInput {
  applicantFilters: ApplicantFilterValues;
  appliedApplicantsPage: number;
  appliedApplicantsPageSize: number;
  appliedApplicantsSearchTerm: string;
  appliedApplicantsSortColumn: string | null;
  appliedApplicantsSortDirection: 'asc' | 'desc';
  canFetchApplicants: boolean;
  isJobMatchEnabled: boolean;
  positionId: string | null;
  potentialApplicantsPage: number;
  potentialApplicantsPageSize: number;
  potentialApplicantsSearchTerm: string;
  potentialApplicantsSortColumn: string | null;
  potentialApplicantsSortDirection: 'asc' | 'desc';
  setAppliedApplicants: Dispatch<SetStateAction<Applicant[]>>;
  setAppliedApplicantsCount: Dispatch<SetStateAction<number>>;
  setAppliedApplicantsTotal: Dispatch<SetStateAction<number>>;
  setFilteredApplicants: Dispatch<SetStateAction<Applicant[]>>;
  setFilteredApplicantsTotal: Dispatch<SetStateAction<number>>;
  setPotentialApplicants: Dispatch<SetStateAction<Applicant[]>>;
  setPotentialApplicantsTotal: Dispatch<SetStateAction<number>>;
}

export function usePositionApplicantFetches({
  applicantFilters,
  appliedApplicantsPage,
  appliedApplicantsPageSize,
  appliedApplicantsSearchTerm,
  appliedApplicantsSortColumn,
  appliedApplicantsSortDirection,
  canFetchApplicants,
  isJobMatchEnabled,
  positionId,
  potentialApplicantsPage,
  potentialApplicantsPageSize,
  potentialApplicantsSearchTerm,
  potentialApplicantsSortColumn,
  potentialApplicantsSortDirection,
  setAppliedApplicants,
  setAppliedApplicantsCount,
  setAppliedApplicantsTotal,
  setFilteredApplicants,
  setFilteredApplicantsTotal,
  setPotentialApplicants,
  setPotentialApplicantsTotal,
}: UsePositionApplicantFetchesInput) {
  const fetchAppliedApplicants = useCallback(async () => {
    if (!positionId) return;

    try {
      const filteredPagePromise = fetchPositionApplicantsPage({
        positionId,
        page: appliedApplicantsPage,
        pageSize: appliedApplicantsPageSize,
        applicantType: 'applied',
        searchTerm: appliedApplicantsSearchTerm,
        sortColumn: appliedApplicantsSortColumn,
        sortDirection: appliedApplicantsSortDirection,
        filters: applicantFilters,
      });
      const countPagePromise = fetchPositionApplicantsPage({
        positionId,
        page: 1,
        pageSize: 1,
        applicantType: 'applied',
        searchTerm: '',
        sortColumn: null,
        sortDirection: 'desc',
      });
      const [{ applicants, total }, { total: appliedCount }] = await Promise.all([
        filteredPagePromise,
        countPagePromise,
      ]);

      setAppliedApplicants(applicants);
      setAppliedApplicantsTotal(total);
      setAppliedApplicantsCount(appliedCount);
    } catch {
      setAppliedApplicants([]);
      setAppliedApplicantsTotal(0);
      setAppliedApplicantsCount(0);
    }
  }, [
    applicantFilters,
    appliedApplicantsPage,
    appliedApplicantsPageSize,
    appliedApplicantsSearchTerm,
    appliedApplicantsSortColumn,
    appliedApplicantsSortDirection,
    positionId,
    setAppliedApplicants,
    setAppliedApplicantsCount,
    setAppliedApplicantsTotal,
  ]);

  const fetchAllApplicants = useCallback(async () => {
    if (!positionId) return;

    try {
      const { applicants, total } = await fetchPositionApplicantsPage({
        positionId,
        page: 1,
        pageSize: 100,
        applicantType: 'all',
        searchTerm: '',
        sortColumn: 'fitScore',
        sortDirection: 'desc',
        filters: applicantFilters,
      });

      setFilteredApplicants(applicants);
      setFilteredApplicantsTotal(total);
    } catch {
      setFilteredApplicants([]);
      setFilteredApplicantsTotal(0);
    }
  }, [
    applicantFilters,
    positionId,
    setFilteredApplicants,
    setFilteredApplicantsTotal,
  ]);

  const fetchPotentialApplicants = useCallback(async () => {
    if (!positionId || !isJobMatchEnabled) return;

    try {
      const { applicants, total } = await fetchPotentialPositionApplicantsPage({
        positionId,
        page: potentialApplicantsPage,
        pageSize: potentialApplicantsPageSize,
        searchTerm: potentialApplicantsSearchTerm,
        sortColumn: potentialApplicantsSortColumn,
        sortDirection: potentialApplicantsSortDirection,
        filters: applicantFilters,
      });

      setPotentialApplicants(applicants);
      setPotentialApplicantsTotal(total);
    } catch {
      setPotentialApplicants([]);
      setPotentialApplicantsTotal(0);
    }
  }, [
    applicantFilters,
    isJobMatchEnabled,
    positionId,
    potentialApplicantsPage,
    potentialApplicantsPageSize,
    potentialApplicantsSearchTerm,
    potentialApplicantsSortColumn,
    potentialApplicantsSortDirection,
    setPotentialApplicants,
    setPotentialApplicantsTotal,
  ]);

  useDebouncedPositionApplicantFetch({
    enabled: canFetchApplicants,
    fetchApplicants: fetchAppliedApplicants,
    dependencies: [
      appliedApplicantsPage,
      appliedApplicantsPageSize,
      appliedApplicantsSearchTerm,
      appliedApplicantsSortColumn,
      appliedApplicantsSortDirection,
      applicantFilters,
    ],
    errorContext: 'applied Applicants',
  });

  useDebouncedPositionApplicantFetch({
    enabled: canFetchApplicants,
    fetchApplicants: fetchAllApplicants,
    dependencies: [applicantFilters],
    errorContext: 'all Applicants',
  });

  useDebouncedPositionApplicantFetch({
    enabled: canFetchApplicants,
    fetchApplicants: fetchPotentialApplicants,
    dependencies: [
      potentialApplicantsPage,
      potentialApplicantsPageSize,
      potentialApplicantsSearchTerm,
      potentialApplicantsSortColumn,
      potentialApplicantsSortDirection,
      applicantFilters,
    ],
    errorContext: 'potential Applicants',
  });

  return {
    fetchAllApplicants,
    fetchAppliedApplicants,
    fetchPotentialApplicants,
  };
}
