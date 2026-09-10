export type UserPreferencesByIdRouteContext = {
  params: Promise<{ userId: string }>;
};

export type UserPreferenceRow = {
  modelType: string;
  attributeKey: string;
  uiPreference: string | null;
};

export type LegacyUserPreferences = {
  taskBoard: {
    searchTerm: string;
    filterPriority: string;
    filterAssignee: string;
    selectedStages: unknown[];
    viewMode: 'kanban' | 'table';
  };
  positions: {
    searchTerm: string;
    departmentFilter: string;
    statusFilter: string;
    selectedRecruiterId: string | null;
    pageSize: number;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
  };
  appearance: {
    personalColor: string;
  };
  sidebar: {
    showAssignedPositions: boolean;
    mainSidebarPinned: boolean;
  };
};

export const LEGACY_USER_PREFERENCE_SECTIONS = ['taskBoard', 'positions', 'appearance', 'sidebar'] as const;

export type LegacyUserPreferenceSection = typeof LEGACY_USER_PREFERENCE_SECTIONS[number];
