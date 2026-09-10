import type { LegacyUserPreferences, UserPreferenceRow } from './user-preferences-id-schema';

type LegacyPreferenceSetter = (preferences: LegacyUserPreferences, value: string | null) => void;

const taskBoardPreferenceSetters: Record<string, LegacyPreferenceSetter> = {
  searchTerm: (preferences, value) => {
    preferences.taskBoard.searchTerm = value || '';
  },
  filterPriority: (preferences, value) => {
    preferences.taskBoard.filterPriority = value || '';
  },
  filterAssignee: (preferences, value) => {
    preferences.taskBoard.filterAssignee = value || '';
  },
  selectedStages: (preferences, value) => {
    preferences.taskBoard.selectedStages = parseJsonArray(value);
  },
  viewMode: (preferences, value) => {
    preferences.taskBoard.viewMode = value === 'table' ? 'table' : 'kanban';
  },
};

const positionsPreferenceSetters: Record<string, LegacyPreferenceSetter> = {
  searchTerm: (preferences, value) => {
    preferences.positions.searchTerm = value || '';
  },
  departmentFilter: (preferences, value) => {
    preferences.positions.departmentFilter = value || '';
  },
  statusFilter: (preferences, value) => {
    preferences.positions.statusFilter = value || '';
  },
  selectedRecruiterId: (preferences, value) => {
    preferences.positions.selectedRecruiterId = value === 'null' ? null : value;
  },
  pageSize: (preferences, value) => {
    preferences.positions.pageSize = parseIntPreference(value, 20);
  },
  sortBy: (preferences, value) => {
    preferences.positions.sortBy = value || '';
  },
  sortOrder: (preferences, value) => {
    preferences.positions.sortOrder = value === 'asc' ? 'asc' : 'desc';
  },
};

const appearancePreferenceSetters: Record<string, LegacyPreferenceSetter> = {
  personalColor: (preferences, value) => {
    preferences.appearance.personalColor = value || '#3B82F6';
  },
};

const sidebarPreferenceSetters: Record<string, LegacyPreferenceSetter> = {
  showAssignedPositions: (preferences, value) => {
    preferences.sidebar.showAssignedPositions = value === 'true';
  },
  mainSidebarPinned: (preferences, value) => {
    preferences.sidebar.mainSidebarPinned = value !== 'false';
  },
};

const legacyPreferenceSetters: Record<string, Record<string, LegacyPreferenceSetter>> = {
  taskBoard: taskBoardPreferenceSetters,
  positions: positionsPreferenceSetters,
  appearance: appearancePreferenceSetters,
  sidebar: sidebarPreferenceSetters,
};

export function createDefaultLegacyUserPreferences(): LegacyUserPreferences {
  return {
    taskBoard: {
      searchTerm: '',
      filterPriority: 'all',
      filterAssignee: 'all',
      selectedStages: [],
      viewMode: 'kanban',
    },
    positions: {
      searchTerm: '',
      departmentFilter: 'all',
      statusFilter: 'all',
      selectedRecruiterId: null,
      pageSize: 20,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    },
    appearance: {
      personalColor: '#3B82F6',
    },
    sidebar: {
      showAssignedPositions: false,
      mainSidebarPinned: true,
    },
  };
}

export function transformLegacyUserPreferenceRows(rows: UserPreferenceRow[]) {
  const preferences = createDefaultLegacyUserPreferences();

  rows.forEach((pref) => {
    applyLegacyUserPreference(preferences, pref);
  });

  return preferences;
}

function applyLegacyUserPreference(preferences: LegacyUserPreferences, pref: UserPreferenceRow) {
  legacyPreferenceSetters[pref.modelType]?.[pref.attributeKey]?.(preferences, pref.uiPreference);
}

function parseJsonArray(value: string | null) {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function parseIntPreference(value: string | null, fallback: number) {
  const parsed = Number.parseInt(value || '', 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}
