import { describe, expect, it, vi } from 'vitest';
import { buildApplicantsPageClientViewProps } from './applicants-page-client-view-props';
import type { ApplicantsPageClientController } from './hooks/use-applicants-page-client-controller';

function createControllerFixture() {
  const onTogglePinned = vi.fn();
  const refreshCurrentApplicantsPage = vi.fn();
  const setIsAddModalOpen = vi.fn();
  const setIsBulkUploadModalOpen = vi.fn();
  const setIsSettingsDrawerOpen = vi.fn();
  const handleFilterChange = vi.fn();
  const onFilterChange = vi.fn();
  const aiMatchedApplicantIds = ['applicant-1'];
  const positions = [{ id: 'position-1', name: 'Designer' }];
  const recruiters = [{ id: 'recruiter-1', name: 'Mina' }];
  const stages = [{ id: 'stage-1', name: 'Screening' }];
  const rawStages = [{ id: 'raw-stage-1', name: 'Raw Screening' }];
  const sources = [{ id: 'source-1', name: 'Referral' }];

  const controller = {
    layout: {
      isMobile: false,
      isFilterPinned: true,
    },
    refs: {
      sidebarFilterRef: { current: null },
    },
    filters: {
      values: { query: 'frontend' },
      activeFilterCount: 2,
      advancedQuery: 'skills:"react"',
      handleFilterChange,
      onFilterChange,
      onClearAll: vi.fn(),
      onTogglePinned,
      horizontalSelectedFitScoreGrades: ['A'],
      horizontalSelectedMatchingFitScoreGrades: ['B'],
      onAppliedGradeToggle: vi.fn(),
      onMatchingGradeToggle: vi.fn(),
      onClearHorizontalFitScores: vi.fn(),
    },
    ai: {
      aiSearchReasoning: 'Matched by skills',
      aiMatchedApplicantIds,
      aiRecordCount: 7,
      isAiSearchActive: true,
      isAiSearching: false,
      isSearchDrawerOpen: true,
      setIsSearchDrawerOpen: vi.fn(),
      handleAiSearch: vi.fn(),
      cancelAiSearch: vi.fn(),
    },
    settings: {
      applicantSettings: { columns: ['name'] },
      settingsLoading: false,
      settingsError: null,
      clearSettingsError: vi.fn(),
      pageSize: 25,
      sortColumn: 'createdAt',
      sortDirection: 'desc',
      groupBy: 'none',
      exportImportFeatureEnabled: true,
      onSettingsChange: vi.fn(),
      onPageSizeChange: vi.fn(),
      onSortChange: vi.fn(),
      onGroupByChange: vi.fn(),
    },
    available: {
      positions,
      stages,
      recruiters,
      sources,
      rawStages,
    },
    permissions: {
      canEditApplicants: true,
      canDeleteApplicants: false,
      canChangeStatus: true,
      canBulkChangeStatus: true,
      canViewDetailed: true,
      canAssignSource: true,
      canAssignRecruiter: true,
    },
    table: {
      applicantsToRender: [{ id: 'applicant-1' }],
      allPinnedApplicants: [],
      displayedApplicants: [{ id: 'applicant-1' }],
      isLoading: false,
      tableLoading: true,
      tableHeight: 640,
      page: 3,
      setPage: vi.fn(),
      total: 51,
      totalPages: 3,
      fetchTableData: vi.fn(),
      refreshApplicantInList: vi.fn(),
      fetchAllPinnedApplicants: vi.fn(),
    },
    scoring: {
      applicantScoreCounts: { A: 4 },
      isFilterDataLoading: true,
    },
    rows: {
      updateApplicantStatus: vi.fn(),
      handleDeleteApplicant: vi.fn(),
      handleAssignRecruiter: vi.fn(),
      handleAssignSource: vi.fn(),
    },
    bulk: {
      selectedApplicantIds: ['applicant-1'],
      setSelectedApplicantIds: vi.fn(),
      handleBulkDelete: vi.fn(),
      handleBulkChangeStatus: vi.fn(),
      handleBulkAssignRecruiter: vi.fn(),
      handleBulkReprocess: vi.fn(),
    },
    modals: {
      setIsAddModalOpen,
      setIsBulkUploadModalOpen,
      setIsSettingsDrawerOpen,
      isAddModalOpen: false,
      isBulkUploadModalOpen: false,
      isImportModalOpen: false,
      isPositionDrawerOpen: false,
      isSettingsDrawerOpen: false,
      isBulkStatusModalOpen: false,
      isBulkRecruiterModalOpen: false,
      isMobileFilterModalOpen: false,
      setIsImportModalOpen: vi.fn(),
      setIsPositionDrawerOpen: vi.fn(),
      setIsBulkStatusModalOpen: vi.fn(),
      setIsBulkRecruiterModalOpen: vi.fn(),
      setIsMobileFilterModalOpen: vi.fn(),
      selectedPositionForEdit: null,
      setSelectedPositionForEdit: vi.fn(),
      bulkNewStatus: 'screening',
      setBulkNewStatus: vi.fn(),
      bulkTransitionNotes: '',
      setBulkTransitionNotes: vi.fn(),
      bulkNewRecruiterId: 'recruiter-1',
      setBulkNewRecruiterId: vi.fn(),
    },
    importExport: {
      handleExportApplicants: vi.fn(),
      handleImportApplicants: vi.fn(),
    },
    searchExperience: {
      applicants: [{ id: 'applicant-2' }],
      stageNames: { 'stage-1': 'Screening' },
      stageColors: { 'stage-1': '#123456' },
    },
    refreshCurrentApplicantsPage,
  } as unknown as ApplicantsPageClientController;

  return {
    controller,
    handleFilterChange,
    onFilterChange,
    onTogglePinned,
    refreshCurrentApplicantsPage,
    setIsAddModalOpen,
    setIsBulkUploadModalOpen,
    setIsSettingsDrawerOpen,
  };
}

describe('buildApplicantsPageClientViewProps', () => {
  it('maps controller state and callbacks into view prop groups', () => {
    const fixture = createControllerFixture();
    const props = buildApplicantsPageClientViewProps(fixture.controller);

    expect(props.isMobile).toBe(false);
    expect(props.isFilterPinned).toBe(true);
    expect(props.mobileFitScoreProps.aiMatchedCount).toBe(7);
    expect(props.pinnedFilterProps.isLoading).toBe(true);
    expect(props.headerProps.activeFilterCount).toBe(2);
    expect(props.tableAreaProps.aiMatchedApplicantIdsForRefresh).toEqual(['applicant-1']);
    expect(props.mobileFilterProps.isAiSearching).toBe(false);
    expect(props.searchExperienceProps.onFilterChange).toBe(fixture.handleFilterChange);
    expect(props.searchExperienceProps.onFilterChange).not.toBe(fixture.onFilterChange);

    props.pinnedFilterProps.onUnpin();
    props.headerProps.onAddApplicant();
    props.headerProps.onBulkUpload();
    props.headerProps.onSettings();

    expect(fixture.onTogglePinned).toHaveBeenCalledWith(false);
    expect(fixture.setIsAddModalOpen).toHaveBeenCalledWith(true);
    expect(fixture.setIsBulkUploadModalOpen).toHaveBeenCalledWith(true);
    expect(fixture.setIsSettingsDrawerOpen).toHaveBeenCalledWith(true);
  });

  it('reuses the current-page refresh callback for applicant-changing modal events', () => {
    const fixture = createControllerFixture();
    const props = buildApplicantsPageClientViewProps(fixture.controller);

    expect(props.modalsProps.onApplicantCreated).toBe(fixture.refreshCurrentApplicantsPage);
    expect(props.modalsProps.onBulkUploadSuccess).toBe(fixture.refreshCurrentApplicantsPage);
    expect(props.modalsProps.onImportSuccess).toBe(fixture.refreshCurrentApplicantsPage);
  });
});
