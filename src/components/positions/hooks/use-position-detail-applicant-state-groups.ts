"use client";

import type { RecruitmentStage } from '@/lib/types';
import { usePositionApplicantLifecycle } from './use-position-applicant-lifecycle';
import { usePositionApplicantListState } from './use-position-applicant-list-state';
import { usePositionApplicantPanelState } from './use-position-applicant-panel-state';

interface UsePositionDetailApplicantStateGroupsInput {
  isJobMatchEnabled: boolean;
  isOpen: boolean;
  panelState: ReturnType<typeof usePositionApplicantPanelState>;
  recruitmentStages: RecruitmentStage[];
}

export function usePositionDetailApplicantStateGroups({
  isJobMatchEnabled,
  isOpen,
  panelState,
  recruitmentStages,
}: UsePositionDetailApplicantStateGroupsInput) {
  const appliedApplicantState = usePositionApplicantListState({
    excludedSortColumns: ['fitScore'],
    initialSortColumn: 'fitScore',
  });
  const potentialApplicantState = usePositionApplicantListState({
    initialSortColumn: 'matchScore',
  });

  usePositionApplicantLifecycle({
    activeApplicantTab: panelState.activeApplicantTab,
    hasInitializedDefaultApplicantFiltersRef: panelState.hasInitializedDefaultApplicantFiltersRef,
    isJobMatchEnabled,
    isOpen,
    recruitmentStages,
    setActiveApplicantTab: panelState.setActiveApplicantTab,
    setApplicantFilters: panelState.setApplicantFilters,
    setAppliedApplicants: appliedApplicantState.setApplicants,
    setAppliedApplicantsCount: panelState.setAppliedApplicantsCount,
    setAppliedApplicantsOpenMenu: appliedApplicantState.setOpenMenu,
    setAppliedApplicantsPage: appliedApplicantState.setPage,
    setAppliedApplicantsSearchTerm: appliedApplicantState.setSearchTerm,
    setAppliedApplicantsSortColumn: appliedApplicantState.setSortColumn,
    setAppliedApplicantsSortDirection: appliedApplicantState.setSortDirection,
    setAppliedApplicantsTotal: appliedApplicantState.setTotal,
    setFilteredApplicants: panelState.setFilteredApplicants,
    setFilteredApplicantsTotal: panelState.setFilteredApplicantsTotal,
    setPotentialApplicants: potentialApplicantState.setApplicants,
    setPotentialApplicantsOpenMenu: potentialApplicantState.setOpenMenu,
    setPotentialApplicantsPage: potentialApplicantState.setPage,
    setPotentialApplicantsSearchTerm: potentialApplicantState.setSearchTerm,
    setPotentialApplicantsSortColumn: potentialApplicantState.setSortColumn,
    setPotentialApplicantsSortDirection: potentialApplicantState.setSortDirection,
    setPotentialApplicantsTotal: potentialApplicantState.setTotal,
  });

  return {
    appliedApplicantState,
    potentialApplicantState,
  };
}
