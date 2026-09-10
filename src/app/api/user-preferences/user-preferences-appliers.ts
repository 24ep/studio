import {
  getDefaultApplicantColumnOrder,
  getDefaultVisibleCardFields,
  type UserPreferenceDefaults,
} from './user-preferences-defaults';
import { parseIntPreference, parseJsonArray } from './user-preferences-parsers';

const TASK_BOARD_TEXT_KEYS = ['searchTerm', 'filterPriority', 'filterAssignee'] as const;
const TASK_BOARD_BOOLEAN_KEYS = [
  'showAvatar',
  'showName',
  'showEmail',
  'showDescription',
  'showFitScore',
  'showAssignee',
  'showPriority',
  'showDueDate',
  'showTags',
  'showSkills',
  'showJobApplied',
] as const;
const TASK_BOARD_CARD_WIDTHS = ['narrow', 'wide', 'custom'] as const;
const POSITIONS_TEXT_KEYS = ['searchTerm', 'departmentFilter', 'statusFilter', 'sortBy'] as const;
const APPLICANT_BOOLEAN_KEYS = [
  'showApplicantColumn',
  'showAppliedJobColumn',
  'showJobMatchesColumn',
  'showFitScoreColumn',
  'showRecruiterColumn',
  'showSourceColumn',
  'showStatusColumn',
  'showAppliedDateColumn',
  'showLastUpdateColumn',
  'showCreatedDateColumn',
  'showFilters',
  'showHorizontalFitScoreFilters',
  'showPinSection',
] as const;

type PreferenceSetter = (preferences: UserPreferenceDefaults, value: string | null) => void;

const taskBoardSpecialSetters: Record<string, PreferenceSetter> = {
  selectedStages: (preferences, value) => {
    preferences.taskBoard.selectedStages = parseJsonArray(value, []);
  },
  viewMode: (preferences, value) => {
    preferences.taskBoard.viewMode = value === 'table' ? 'table' : 'kanban';
  },
  cardWidth: (preferences, value) => {
    preferences.taskBoard.cardWidth = isKnownKey(TASK_BOARD_CARD_WIDTHS, value) ? value : 'medium';
  },
  customCardWidth: (preferences, value) => {
    preferences.taskBoard.customCardWidth = parseIntPreference(value, 256);
  },
  visibleCardFields: (preferences, value) => {
    preferences.taskBoard.visibleCardFields = parseJsonArray(value, getDefaultVisibleCardFields());
  },
};

const positionsSpecialSetters: Record<string, PreferenceSetter> = {
  selectedRecruiterId: (preferences, value) => {
    preferences.positions.selectedRecruiterId = value === 'null' ? null : value;
  },
  pageSize: (preferences, value) => {
    preferences.positions.pageSize = parseIntPreference(value, 20);
  },
  sortOrder: (preferences, value) => {
    preferences.positions.sortOrder = value === 'asc' ? 'asc' : 'desc';
  },
};

const applicantSpecialSetters: Record<string, PreferenceSetter> = {
  fitScoreType: (preferences, value) => {
    preferences.applicants.fitScoreType = value === 'matching' ? 'matching' : 'applied';
  },
  fitScoreFilterMode: (preferences, value) => {
    preferences.applicants.fitScoreFilterMode = value === 'multi' ? 'multi' : 'single';
  },
  rowHeight: (preferences, value) => {
    preferences.applicants.rowHeight = value === 'compact' || value === 'comfortable' ? value : 'normal';
  },
  columnOrder: (preferences, value) => {
    preferences.applicants.columnOrder = parseJsonArray(value, getDefaultApplicantColumnOrder());
  },
  pageSize: (preferences, value) => {
    preferences.applicants.pageSize = parseIntPreference(value, 20);
  },
  sortColumn: (preferences, value) => {
    preferences.applicants.sortColumn = value || 'applicationDate';
  },
  sortDirection: (preferences, value) => {
    preferences.applicants.sortDirection = value === 'null' ? null : value === 'asc' ? 'asc' : 'desc';
  },
};

const appearanceSetters: Record<string, PreferenceSetter> = {
  personalColor: (preferences, value) => {
    preferences.appearance.personalColor = value || '#3B82F6';
  },
  themePreference: (preferences, value) => {
    preferences.appearance.themePreference = value === 'light' || value === 'dark' ? value : 'system';
  },
};

const sidebarSetters: Record<string, PreferenceSetter> = {
  showAssignedPositions: (preferences, value) => {
    preferences.sidebar.showAssignedPositions = value === 'true';
  },
  mainSidebarPinned: (preferences, value) => {
    preferences.sidebar.mainSidebarPinned = value !== 'false';
  },
};

export function applyTaskBoardPreference(preferences: UserPreferenceDefaults, key: string, value: string | null) {
  if (applyTextPreference(preferences.taskBoard, TASK_BOARD_TEXT_KEYS, key, value)) {
    return;
  }

  if (applyBooleanPreference(preferences.taskBoard, TASK_BOARD_BOOLEAN_KEYS, key, value)) {
    return;
  }

  taskBoardSpecialSetters[key]?.(preferences, value);
}

export function applyPositionsPreference(preferences: UserPreferenceDefaults, key: string, value: string | null) {
  if (applyTextPreference(preferences.positions, POSITIONS_TEXT_KEYS, key, value)) {
    return;
  }

  positionsSpecialSetters[key]?.(preferences, value);
}

export function applyApplicantPreference(preferences: UserPreferenceDefaults, key: string, value: string | null) {
  if (applyBooleanPreference(preferences.applicants, APPLICANT_BOOLEAN_KEYS, key, value)) {
    return;
  }

  applicantSpecialSetters[key]?.(preferences, value);
}

export function applyAppearancePreference(preferences: UserPreferenceDefaults, key: string, value: string | null) {
  appearanceSetters[key]?.(preferences, value);
}

export function applySidebarPreference(preferences: UserPreferenceDefaults, key: string, value: string | null) {
  sidebarSetters[key]?.(preferences, value);
}

function isKnownKey<const TKeys extends readonly string[]>(
  keys: TKeys,
  key: string | null
): key is TKeys[number] {
  return key !== null && keys.includes(key);
}

function applyTextPreference<TTarget extends Record<string, unknown>, const TKeys extends readonly (keyof TTarget & string)[]>(
  target: TTarget,
  keys: TKeys,
  key: string,
  value: string | null,
) {
  if (!isKnownKey(keys, key)) {
    return false;
  }

  const preferenceKey = key as TKeys[number];
  target[preferenceKey] = (value || '') as TTarget[TKeys[number]];
  return true;
}

function applyBooleanPreference<TTarget extends Record<string, unknown>, const TKeys extends readonly (keyof TTarget & string)[]>(
  target: TTarget,
  keys: TKeys,
  key: string,
  value: string | null,
) {
  if (!isKnownKey(keys, key)) {
    return false;
  }

  const preferenceKey = key as TKeys[number];
  target[preferenceKey] = (value === 'true') as TTarget[TKeys[number]];
  return true;
}
