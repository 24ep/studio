const DEFAULT_VISIBLE_CARD_FIELDS = ['name', 'email', 'fitScore'];
const DEFAULT_APPLICANT_COLUMN_ORDER = [
  'applicant',
  'appliedJob',
  'jobMatches',
  'fitScore',
  'recruiter',
  'source',
  'status',
  'appliedDate',
  'lastUpdate',
  'createdAt',
];

export function getDefaultVisibleCardFields() {
  return [...DEFAULT_VISIBLE_CARD_FIELDS];
}

export function getDefaultApplicantColumnOrder() {
  return [...DEFAULT_APPLICANT_COLUMN_ORDER];
}

export function createDefaultUserPreferences() {
  return {
    taskBoard: {
      searchTerm: '',
      filterPriority: 'all',
      filterAssignee: 'all',
      selectedStages: [] as unknown[],
      viewMode: 'kanban' as 'kanban' | 'table',
      cardWidth: 'medium' as 'narrow' | 'medium' | 'wide' | 'custom',
      customCardWidth: 256,
      visibleCardFields: getDefaultVisibleCardFields(),
      showAvatar: true,
      showName: true,
      showEmail: true,
      showDescription: true,
      showFitScore: true,
      showAssignee: false,
      showPriority: false,
      showDueDate: false,
      showTags: false,
      showSkills: false,
      showJobApplied: false,
    },
    positions: {
      searchTerm: '',
      departmentFilter: 'all',
      statusFilter: 'all',
      selectedRecruiterId: null as string | null,
      pageSize: 20,
      sortBy: 'createdAt',
      sortOrder: 'desc' as 'asc' | 'desc',
    },
    appearance: {
      personalColor: '#3B82F6',
      themePreference: 'system' as 'light' | 'dark' | 'system',
    },
    sidebar: {
      showAssignedPositions: true,
      mainSidebarPinned: true,
    },
    accessibility: {
      textScale: 100,
      increasedContrast: false,
      reducedMotion: false,
      underlineLinks: false,
      locale: 'en-US' as 'en-US' | 'th-TH',
      keyboardShortcuts: true,
    },
    applicants: {
      showApplicantColumn: true,
      showAppliedJobColumn: true,
      showJobMatchesColumn: true,
      showFitScoreColumn: true,
      showRecruiterColumn: true,
      showSourceColumn: true,
      showStatusColumn: true,
      showAppliedDateColumn: true,
      showLastUpdateColumn: true,
      showCreatedDateColumn: false,
      columnOrder: getDefaultApplicantColumnOrder(),
      showFilters: true,
      showHorizontalFitScoreFilters: true,
      fitScoreType: 'applied' as 'applied' | 'matching',
      fitScoreFilterMode: 'single' as 'single' | 'multi',
      rowHeight: 'normal' as 'compact' | 'normal' | 'comfortable',
      showPinSection: true,
      pageSize: 20,
      sortColumn: 'applicationDate',
      sortDirection: 'desc' as 'asc' | 'desc' | null,
    },
  };
}

export type UserPreferenceDefaults = ReturnType<typeof createDefaultUserPreferences>;
