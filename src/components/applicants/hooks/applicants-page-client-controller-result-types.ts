interface ApplicantFilterControlsLike {
  isFilterPinned: unknown;
  onFilterChange: unknown;
  handleClearAllFilters: unknown;
  handleToggleFilterPin: unknown;
  handleHorizontalFitScoreGradeToggle: unknown;
  handleHorizontalMatchingFitScoreGradeToggle: unknown;
  clearAllHorizontalFitScoreFilters: unknown;
}

interface ApplicantEffectiveDataLike {
  activeFilterCount: unknown;
  effectivePositions: unknown;
  effectiveStages: unknown;
  effectiveRecruiter: unknown;
  effectiveSources: unknown;
  canEditApplicants: unknown;
  canDeleteApplicants: unknown;
  canChangeStatus: unknown;
  canBulkChangeStatus: unknown;
  canViewDetailed: unknown;
  canAssignSource: unknown;
  canAssignRecruiter: unknown;
  stageNames: unknown;
  stageColors: unknown;
}

interface ApplicantUiStateLike {
  handleSettingsChange: unknown;
  handlePageSizeChange: unknown;
  handleSortChange: unknown;
  handleGroupByChange: unknown;
}

interface ApplicantImportExportLike {
  exportImportFeatureEnabled: unknown;
}

export interface BuildApplicantsPageClientControllerInput {
  sessionGateMessage: string | null;
  isMobile: boolean;
  filterControls: ApplicantFilterControlsLike;
  sidebarFilterRef: unknown;
  filters: unknown;
  effectiveData: ApplicantEffectiveDataLike;
  advancedQuery: unknown;
  handleFilterChange: unknown;
  horizontalSelectedFitScoreGrades: unknown;
  horizontalSelectedMatchingFitScoreGrades: unknown;
  aiSearchReasoning: unknown;
  aiMatchedApplicantIds: unknown;
  aiRecordCount: unknown;
  isAiSearchActive: unknown;
  isAiSearching: unknown;
  isSearchDrawerOpen: unknown;
  setIsSearchDrawerOpen: unknown;
  handleAiSearch: unknown;
  cancelAiSearch: unknown;
  applicantSettings: unknown;
  settingsLoading: unknown;
  settingsError: unknown;
  clearSettingsError: unknown;
  pageSize: unknown;
  sortColumn: unknown;
  sortDirection: unknown;
  groupBy: unknown;
  importExport: ApplicantImportExportLike;
  uiState: ApplicantUiStateLike;
  availableStages: unknown;
  applicantsToRender: unknown;
  allPinnedApplicants: unknown;
  displayedApplicants: unknown;
  isLoading: unknown;
  tableLoading: unknown;
  tableHeight: unknown;
  page: unknown;
  setPage: unknown;
  total: unknown;
  totalPages: unknown;
  fetchTableData: unknown;
  refreshApplicantInList: unknown;
  fetchAllPinnedApplicants: unknown;
  applicantScoreCounts: unknown;
  isFilterDataLoading: unknown;
  rowActions: unknown;
  bulkActions: unknown;
  filteredApplicants: unknown;
  refreshCurrentApplicantsPage: unknown;
}

export type ApplicantsPageClientControllerResult<TInput extends BuildApplicantsPageClientControllerInput> = {
  sessionGateMessage: TInput['sessionGateMessage'];
  layout: {
    isMobile: TInput['isMobile'];
    isFilterPinned: TInput['filterControls']['isFilterPinned'];
  };
  refs: {
    sidebarFilterRef: TInput['sidebarFilterRef'];
  };
  filters: {
    values: TInput['filters'];
    activeFilterCount: TInput['effectiveData']['activeFilterCount'];
    advancedQuery: TInput['advancedQuery'];
    handleFilterChange: TInput['handleFilterChange'];
    onFilterChange: TInput['filterControls']['onFilterChange'];
    onClearAll: TInput['filterControls']['handleClearAllFilters'];
    onTogglePinned: TInput['filterControls']['handleToggleFilterPin'];
    horizontalSelectedFitScoreGrades: TInput['horizontalSelectedFitScoreGrades'];
    horizontalSelectedMatchingFitScoreGrades: TInput['horizontalSelectedMatchingFitScoreGrades'];
    onAppliedGradeToggle: TInput['filterControls']['handleHorizontalFitScoreGradeToggle'];
    onMatchingGradeToggle: TInput['filterControls']['handleHorizontalMatchingFitScoreGradeToggle'];
    onClearHorizontalFitScores: TInput['filterControls']['clearAllHorizontalFitScoreFilters'];
  };
  ai: {
    aiSearchReasoning: TInput['aiSearchReasoning'];
    aiMatchedApplicantIds: TInput['aiMatchedApplicantIds'];
    aiRecordCount: TInput['aiRecordCount'];
    isAiSearchActive: TInput['isAiSearchActive'];
    isAiSearching: TInput['isAiSearching'];
    isSearchDrawerOpen: TInput['isSearchDrawerOpen'];
    setIsSearchDrawerOpen: TInput['setIsSearchDrawerOpen'];
    handleAiSearch: TInput['handleAiSearch'];
    cancelAiSearch: TInput['cancelAiSearch'];
  };
  settings: {
    applicantSettings: TInput['applicantSettings'];
    settingsLoading: TInput['settingsLoading'];
    settingsError: TInput['settingsError'];
    clearSettingsError: TInput['clearSettingsError'];
    pageSize: TInput['pageSize'];
    sortColumn: TInput['sortColumn'];
    sortDirection: TInput['sortDirection'];
    groupBy: TInput['groupBy'];
    exportImportFeatureEnabled: TInput['importExport']['exportImportFeatureEnabled'];
    onSettingsChange: TInput['uiState']['handleSettingsChange'];
    onPageSizeChange: TInput['uiState']['handlePageSizeChange'];
    onSortChange: TInput['uiState']['handleSortChange'];
    onGroupByChange: TInput['uiState']['handleGroupByChange'];
  };
  available: {
    positions: TInput['effectiveData']['effectivePositions'];
    stages: TInput['effectiveData']['effectiveStages'];
    recruiters: TInput['effectiveData']['effectiveRecruiter'];
    sources: TInput['effectiveData']['effectiveSources'];
    rawStages: TInput['availableStages'];
  };
  permissions: {
    canEditApplicants: TInput['effectiveData']['canEditApplicants'];
    canDeleteApplicants: TInput['effectiveData']['canDeleteApplicants'];
    canChangeStatus: TInput['effectiveData']['canChangeStatus'];
    canBulkChangeStatus: TInput['effectiveData']['canBulkChangeStatus'];
    canViewDetailed: TInput['effectiveData']['canViewDetailed'];
    canAssignSource: TInput['effectiveData']['canAssignSource'];
    canAssignRecruiter: TInput['effectiveData']['canAssignRecruiter'];
  };
  table: {
    applicantsToRender: TInput['applicantsToRender'];
    allPinnedApplicants: TInput['allPinnedApplicants'];
    displayedApplicants: TInput['displayedApplicants'];
    isLoading: TInput['isLoading'];
    tableLoading: TInput['tableLoading'];
    tableHeight: TInput['tableHeight'];
    page: TInput['page'];
    setPage: TInput['setPage'];
    total: TInput['total'];
    totalPages: TInput['totalPages'];
    fetchTableData: TInput['fetchTableData'];
    refreshApplicantInList: TInput['refreshApplicantInList'];
    fetchAllPinnedApplicants: TInput['fetchAllPinnedApplicants'];
  };
  scoring: {
    applicantScoreCounts: TInput['applicantScoreCounts'];
    isFilterDataLoading: TInput['isFilterDataLoading'];
  };
  rows: TInput['rowActions'];
  bulk: TInput['bulkActions'];
  modals: TInput['uiState'];
  importExport: TInput['importExport'];
  searchExperience: {
    applicants: TInput['filteredApplicants'];
    stageNames: TInput['effectiveData']['stageNames'];
    stageColors: TInput['effectiveData']['stageColors'];
  };
  refreshCurrentApplicantsPage: TInput['refreshCurrentApplicantsPage'];
};
