import type { UserProfile } from "@/lib/types";

export interface TaskBoardPreferences {
  searchTerm: string;
  filterPriority: string;
  filterAssignee: string;
  selectedStages: string[];
  viewMode: "kanban" | "table";
}

export interface PositionsPreferences {
  searchTerm: string;
  departmentFilter: string;
  statusFilter: string;
  selectedRecruiterId: string | null;
  pageSize: number;
  sortBy: string;
  sortOrder: "asc" | "desc";
}

export interface AppearancePreferences {
  personalColor: string;
}

export interface SidebarPreferences {
  showAssignedPositions: boolean;
  mainSidebarPinned: boolean;
}

export interface UserPreferences {
  taskBoard: TaskBoardPreferences;
  positions: PositionsPreferences;
  appearance: AppearancePreferences;
  sidebar: SidebarPreferences;
}

export interface UserPreferencesModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserProfile | null;
}

export interface UserPreferencesActions {
  cancel: () => void;
  save: () => Promise<void>;
  updateAppearancePreferences: (updates: Partial<AppearancePreferences>) => void;
  updatePositionsPreferences: (updates: Partial<PositionsPreferences>) => void;
  updateSidebarPreferences: (updates: Partial<SidebarPreferences>) => void;
  updateTaskBoardPreferences: (updates: Partial<TaskBoardPreferences>) => void;
}

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  taskBoard: {
    searchTerm: "",
    filterPriority: "all",
    filterAssignee: "all",
    selectedStages: [],
    viewMode: "kanban",
  },
  positions: {
    searchTerm: "",
    departmentFilter: "all",
    statusFilter: "all",
    selectedRecruiterId: null,
    pageSize: 20,
    sortBy: "createdAt",
    sortOrder: "desc",
  },
  appearance: {
    personalColor: "#3B82F6",
  },
  sidebar: {
    showAssignedPositions: true,
    mainSidebarPinned: true,
  },
};

export function withSidebarPreferences(data: Partial<UserPreferences>): UserPreferences {
  return {
    ...DEFAULT_USER_PREFERENCES,
    ...data,
    taskBoard: {
      ...DEFAULT_USER_PREFERENCES.taskBoard,
      ...data.taskBoard,
    },
    positions: {
      ...DEFAULT_USER_PREFERENCES.positions,
      ...data.positions,
    },
    appearance: {
      ...DEFAULT_USER_PREFERENCES.appearance,
      ...data.appearance,
    },
    sidebar: {
      showAssignedPositions: false,
      mainSidebarPinned: true,
      ...data.sidebar,
    },
  };
}
