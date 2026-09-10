export interface TaskBoardPreferences {
  searchTerm: string;
  filterPriority: string;
  filterAssignee: string;
  selectedStages: string[];
  viewMode: 'kanban' | 'table';
  cardWidth: 'narrow' | 'medium' | 'wide' | 'custom';
  customCardWidth?: number;
  visibleCardFields: string[];
  showAvatar: boolean;
  showName: boolean;
  showEmail: boolean;
  showDescription: boolean;
  showFitScore: boolean;
  showAssignee: boolean;
  showPriority: boolean;
  showDueDate: boolean;
  showTags: boolean;
  showSkills: boolean;
  showJobApplied: boolean;
}

export interface PositionsPreferences {
  searchTerm: string;
  departmentFilter: string;
  statusFilter: string;
  selectedRecruiterId: string | null;
  pageSize: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export interface AppearancePreferences {
  personalColor: string;
  themePreference: 'light' | 'dark' | 'system';
}

export interface SidebarPreferences {
  showAssignedPositions: boolean;
  mainSidebarPinned: boolean;
}

export interface AccessibilityPreferences {
  textScale: number;
  increasedContrast: boolean;
  reducedMotion: boolean;
  underlineLinks: boolean;
  locale: string;
  keyboardShortcuts: boolean;
}

export interface UserPreferences {
  taskBoard: TaskBoardPreferences;
  positions: PositionsPreferences;
  appearance: AppearancePreferences;
  sidebar: SidebarPreferences;
  accessibility: AccessibilityPreferences;
}

export type PreferenceModelType = keyof UserPreferences;

export const defaultTaskBoardPreferences: TaskBoardPreferences = {
  searchTerm: '',
  filterPriority: 'all',
  filterAssignee: 'all',
  selectedStages: [],
  viewMode: 'kanban',
  cardWidth: 'medium',
  customCardWidth: 256,
  visibleCardFields: ['name', 'email', 'fitScore'],
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
};

export const defaultPositionsPreferences: PositionsPreferences = {
  searchTerm: '',
  departmentFilter: 'all',
  statusFilter: 'all',
  selectedRecruiterId: null,
  pageSize: 20,
  sortBy: 'createdAt',
  sortOrder: 'desc',
};

export const defaultAppearancePreferences: AppearancePreferences = {
  personalColor: '#3B82F6',
  themePreference: 'system',
};

export const defaultSidebarPreferences: SidebarPreferences = {
  showAssignedPositions: true,
  mainSidebarPinned: true,
};

export const defaultAccessibilityPreferences: AccessibilityPreferences = {
  textScale: 100,
  increasedContrast: false,
  reducedMotion: false,
  underlineLinks: false,
  locale: 'en-US',
  keyboardShortcuts: true,
};

export const defaultPreferences: UserPreferences = {
  taskBoard: defaultTaskBoardPreferences,
  positions: defaultPositionsPreferences,
  appearance: defaultAppearancePreferences,
  sidebar: defaultSidebarPreferences,
  accessibility: defaultAccessibilityPreferences,
};

export function mergeUserPreferences(data: Partial<UserPreferences> = {}): UserPreferences {
  return {
    taskBoard: { ...defaultTaskBoardPreferences, ...data.taskBoard },
    positions: { ...defaultPositionsPreferences, ...data.positions },
    appearance: { ...defaultAppearancePreferences, ...data.appearance },
    sidebar: { ...defaultSidebarPreferences, ...data.sidebar },
    accessibility: { ...defaultAccessibilityPreferences, ...data.accessibility },
  };
}
