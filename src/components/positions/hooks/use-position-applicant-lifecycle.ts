"use client";

import { useEffect, type Dispatch, type MutableRefObject, type SetStateAction } from 'react';

import type { Applicant, ApplicantFilterValues, RecruitmentStage } from '@/lib/types';
import {
  getInitialPositionApplicantFilters,
} from '../position-detail-drawer-utils';

interface UsePositionApplicantLifecycleInput {
  activeApplicantTab: string;
  hasInitializedDefaultApplicantFiltersRef: MutableRefObject<boolean>;
  isJobMatchEnabled: boolean;
  isOpen: boolean;
  recruitmentStages: RecruitmentStage[];
  setActiveApplicantTab: Dispatch<SetStateAction<string>>;
  setApplicantFilters: Dispatch<SetStateAction<ApplicantFilterValues>>;
  setAppliedApplicants: Dispatch<SetStateAction<Applicant[]>>;
  setAppliedApplicantsCount: Dispatch<SetStateAction<number>>;
  setAppliedApplicantsOpenMenu: Dispatch<SetStateAction<string | null>>;
  setAppliedApplicantsPage: Dispatch<SetStateAction<number>>;
  setAppliedApplicantsSearchTerm: Dispatch<SetStateAction<string>>;
  setAppliedApplicantsSortColumn: Dispatch<SetStateAction<string | null>>;
  setAppliedApplicantsSortDirection: Dispatch<SetStateAction<'asc' | 'desc'>>;
  setAppliedApplicantsTotal: Dispatch<SetStateAction<number>>;
  setFilteredApplicants: Dispatch<SetStateAction<Applicant[]>>;
  setFilteredApplicantsTotal: Dispatch<SetStateAction<number>>;
  setPotentialApplicants: Dispatch<SetStateAction<Applicant[]>>;
  setPotentialApplicantsOpenMenu: Dispatch<SetStateAction<string | null>>;
  setPotentialApplicantsPage: Dispatch<SetStateAction<number>>;
  setPotentialApplicantsSearchTerm: Dispatch<SetStateAction<string>>;
  setPotentialApplicantsSortColumn: Dispatch<SetStateAction<string | null>>;
  setPotentialApplicantsSortDirection: Dispatch<SetStateAction<'asc' | 'desc'>>;
  setPotentialApplicantsTotal: Dispatch<SetStateAction<number>>;
}

export function usePositionApplicantLifecycle({
  activeApplicantTab,
  hasInitializedDefaultApplicantFiltersRef,
  isJobMatchEnabled,
  isOpen,
  recruitmentStages,
  setActiveApplicantTab,
  setApplicantFilters,
  setAppliedApplicants,
  setAppliedApplicantsCount,
  setAppliedApplicantsOpenMenu,
  setAppliedApplicantsPage,
  setAppliedApplicantsSearchTerm,
  setAppliedApplicantsSortColumn,
  setAppliedApplicantsSortDirection,
  setAppliedApplicantsTotal,
  setFilteredApplicants,
  setFilteredApplicantsTotal,
  setPotentialApplicants,
  setPotentialApplicantsOpenMenu,
  setPotentialApplicantsPage,
  setPotentialApplicantsSearchTerm,
  setPotentialApplicantsSortColumn,
  setPotentialApplicantsSortDirection,
  setPotentialApplicantsTotal,
}: UsePositionApplicantLifecycleInput) {
  useEffect(() => {
    if (!isJobMatchEnabled && activeApplicantTab !== 'applied') {
      setActiveApplicantTab('applied');
    }
  }, [isJobMatchEnabled, activeApplicantTab, setActiveApplicantTab]);

  useEffect(() => {
    if (!isOpen || recruitmentStages.length === 0 || hasInitializedDefaultApplicantFiltersRef.current) {
      return;
    }

    setApplicantFilters((currentFilters) => {
      hasInitializedDefaultApplicantFiltersRef.current = true;
      return getInitialPositionApplicantFilters(currentFilters, recruitmentStages);
    });
  }, [hasInitializedDefaultApplicantFiltersRef, isOpen, recruitmentStages, setApplicantFilters]);

  useEffect(() => {
    if (isOpen) {
      return;
    }

    setFilteredApplicants([]);
    setFilteredApplicantsTotal(0);
    setAppliedApplicants([]);
    setAppliedApplicantsCount(0);
    setAppliedApplicantsTotal(0);
    setPotentialApplicants([]);
    setPotentialApplicantsTotal(0);
    setAppliedApplicantsSearchTerm('');
    setAppliedApplicantsPage(1);
    setPotentialApplicantsSearchTerm('');
    setPotentialApplicantsPage(1);
    setAppliedApplicantsSortColumn('fitScore');
    setAppliedApplicantsSortDirection('desc');
    setAppliedApplicantsOpenMenu(null);
    setPotentialApplicantsSortColumn('matchScore');
    setPotentialApplicantsSortDirection('desc');
    setPotentialApplicantsOpenMenu(null);
    setApplicantFilters({});
    hasInitializedDefaultApplicantFiltersRef.current = false;
  }, [
    hasInitializedDefaultApplicantFiltersRef,
    isOpen,
    setApplicantFilters,
    setAppliedApplicants,
    setAppliedApplicantsCount,
    setAppliedApplicantsOpenMenu,
    setAppliedApplicantsPage,
    setAppliedApplicantsSearchTerm,
    setAppliedApplicantsSortColumn,
    setAppliedApplicantsSortDirection,
    setAppliedApplicantsTotal,
    setFilteredApplicants,
    setFilteredApplicantsTotal,
    setPotentialApplicants,
    setPotentialApplicantsOpenMenu,
    setPotentialApplicantsPage,
    setPotentialApplicantsSearchTerm,
    setPotentialApplicantsSortColumn,
    setPotentialApplicantsSortDirection,
    setPotentialApplicantsTotal,
  ]);
}
