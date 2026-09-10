"use client";

import type { RecruitmentStage } from '@/lib/types';
import { usePositionApplicantPinActions } from './use-position-applicant-pin-actions';
import { usePositionApplicantAiSearch } from './use-position-applicant-ai-search';
import { usePositionApplicantFetches } from './use-position-applicant-fetches';
import { usePositionApplicantPanelState } from './use-position-applicant-panel-state';
import { usePositionDetailApplicantStateGroups } from './use-position-detail-applicant-state-groups';

interface UsePositionDetailApplicantsInput {
  isOpen: boolean;
  positionId: string | null;
  sessionStatus: string;
  isJobMatchEnabled: boolean;
  recruitmentStages: RecruitmentStage[];
}

export function usePositionDetailApplicants({
  isOpen,
  positionId,
  sessionStatus,
  isJobMatchEnabled,
  recruitmentStages,
}: UsePositionDetailApplicantsInput) {
  const panelState = usePositionApplicantPanelState({ recruitmentStages });
  const {
    activeApplicantTab,
    allApplicantsTotal,
    appliedApplicantsCount,
    applicantFilters,
    filteredApplicants,
    handleClearApplicantFilters,
    setActiveApplicantTab,
    setAppliedApplicantsCount,
    setApplicantFilters,
    setFilteredApplicants,
    setFilteredApplicantsTotal,
    stageNames,
  } = panelState;
  const {
    appliedApplicantState,
    potentialApplicantState,
  } = usePositionDetailApplicantStateGroups({
    isJobMatchEnabled,
    isOpen,
    panelState,
    recruitmentStages,
  });

  const {
    handlePositionApplicantAiSearch,
    isAiSearchingApplicants,
  } = usePositionApplicantAiSearch({
    setAppliedApplicants: appliedApplicantState.setApplicants,
    setAppliedApplicantsTotal: appliedApplicantState.setTotal,
    setApplicantFilters,
    setFilteredApplicants,
    setFilteredApplicantsTotal,
    setPotentialApplicants: potentialApplicantState.setApplicants,
    setPotentialApplicantsTotal: potentialApplicantState.setTotal,
  });

  const {
    fetchAllApplicants,
    fetchAppliedApplicants,
    fetchPotentialApplicants,
  } = usePositionApplicantFetches({
    applicantFilters,
    appliedApplicantsPage: appliedApplicantState.page,
    appliedApplicantsPageSize: appliedApplicantState.pageSize,
    appliedApplicantsSearchTerm: appliedApplicantState.searchTerm,
    appliedApplicantsSortColumn: appliedApplicantState.sortColumn,
    appliedApplicantsSortDirection: appliedApplicantState.sortDirection,
    canFetchApplicants: isOpen && Boolean(positionId) && sessionStatus === 'authenticated',
    isJobMatchEnabled,
    positionId,
    potentialApplicantsPage: potentialApplicantState.page,
    potentialApplicantsPageSize: potentialApplicantState.pageSize,
    potentialApplicantsSearchTerm: potentialApplicantState.searchTerm,
    potentialApplicantsSortColumn: potentialApplicantState.sortColumn,
    potentialApplicantsSortDirection: potentialApplicantState.sortDirection,
    setAppliedApplicants: appliedApplicantState.setApplicants,
    setAppliedApplicantsCount,
    setAppliedApplicantsTotal: appliedApplicantState.setTotal,
    setFilteredApplicants,
    setFilteredApplicantsTotal,
    setPotentialApplicants: potentialApplicantState.setApplicants,
    setPotentialApplicantsTotal: potentialApplicantState.setTotal,
  });

  const {
    handleAppliedApplicantPinToggle,
    handlePotentialApplicantPinToggle,
  } = usePositionApplicantPinActions({
    setAppliedApplicants: appliedApplicantState.setApplicants,
    setPotentialApplicants: potentialApplicantState.setApplicants,
    setFilteredApplicants,
  });

  return {
    activeApplicantTab,
    allApplicantsTotal,
    applicantFilters,
    appliedApplicants: appliedApplicantState.applicants,
    appliedApplicantsCount,
    appliedApplicantsOpenMenu: appliedApplicantState.openMenu,
    appliedApplicantsPage: appliedApplicantState.page,
    appliedApplicantsPageSize: appliedApplicantState.pageSize,
    appliedApplicantsSearchTerm: appliedApplicantState.searchTerm,
    appliedApplicantsSortColumn: appliedApplicantState.sortColumn,
    appliedApplicantsSortDirection: appliedApplicantState.sortDirection,
    appliedApplicantsTotal: appliedApplicantState.total,
    filteredApplicants,
    fetchAllApplicants,
    fetchAppliedApplicants,
    fetchPotentialApplicants,
    handleAppliedApplicantPinToggle,
    handleAppliedApplicantsSort: appliedApplicantState.handleSort,
    handleClearApplicantFilters,
    handlePositionApplicantAiSearch,
    handlePotentialApplicantPinToggle,
    handlePotentialApplicantsSort: potentialApplicantState.handleSort,
    isAiSearchingApplicants,
    potentialApplicants: potentialApplicantState.applicants,
    potentialApplicantsOpenMenu: potentialApplicantState.openMenu,
    potentialApplicantsPage: potentialApplicantState.page,
    potentialApplicantsPageSize: potentialApplicantState.pageSize,
    potentialApplicantsSearchTerm: potentialApplicantState.searchTerm,
    potentialApplicantsSortColumn: potentialApplicantState.sortColumn,
    potentialApplicantsSortDirection: potentialApplicantState.sortDirection,
    potentialApplicantsTotal: potentialApplicantState.total,
    setActiveApplicantTab,
    setApplicantFilters,
    setAppliedApplicantsOpenMenu: appliedApplicantState.setOpenMenu,
    setAppliedApplicantsPage: appliedApplicantState.setPage,
    setAppliedApplicantsPageSize: appliedApplicantState.setPageSize,
    setAppliedApplicantsSearchTerm: appliedApplicantState.setSearchTerm,
    setPotentialApplicantsOpenMenu: potentialApplicantState.setOpenMenu,
    setPotentialApplicantsPage: potentialApplicantState.setPage,
    setPotentialApplicantsPageSize: potentialApplicantState.setPageSize,
    setPotentialApplicantsSearchTerm: potentialApplicantState.setSearchTerm,
    sortedAppliedApplicants: appliedApplicantState.sortedApplicants,
    sortedPotentialApplicants: potentialApplicantState.sortedApplicants,
    stageNames,
  };
}
