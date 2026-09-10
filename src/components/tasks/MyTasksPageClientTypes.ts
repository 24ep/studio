import type React from "react";

import type { Task } from "@/components/tasks/TaskCard";
import type {
  MyTasksFilters,
  MyTasksRecruiter,
  MyTasksStage,
  TaskboardApplicant,
} from "@/components/tasks/my-tasks-page-utils";
import type { TaskBoardPreferences } from "@/hooks/use-user-preferences";

export interface MyTasksPageClientProps {
  embedded?: boolean;
  headerLeading?: React.ReactNode;
  headerTrailing?: React.ReactNode;
  userSession: {
    id: string;
    role: string;
    name: string | null;
    modulePermissions?: string[];
  } | null;
}

export interface ApplicantSummary {
  id: string;
  name: string;
}

export interface MyTasksPageViewState {
  applicants: TaskboardApplicant[];
  canSeeAllRecruiter: boolean;
  displayedApplicants: TaskboardApplicant[];
  filteredStages: MyTasksStage[];
  filters: MyTasksFilters;
  hasNetworkError: boolean;
  isCardSettingsOpen: boolean;
  isDetailModalOpen: boolean;
  isRecruiter: boolean;
  isStageFilterOpen: boolean;
  loading: boolean;
  memoizedPreferences: TaskBoardPreferences;
  recruiters: MyTasksRecruiter[];
  selectedApplicantSummary: ApplicantSummary | null;
  selectedStages: string[];
  showNetworkDiagnostics: boolean;
  stageNames: Record<string, string>;
  stages: MyTasksStage[];
  totalApplicants: number;
  viewMode: "kanban" | "table";
}

export interface MyTasksPageViewActions {
  clearFilters: () => void;
  closeApplicantDetail: () => void;
  handleMoveTask: (task: Task, newStatus: string) => Promise<void>;
  handleViewModeChange: (viewMode: string) => void;
  openApplicantDetail: (applicant: TaskboardApplicant | Task) => void;
  resetTaskBoardPreferences: () => void;
  setFilters: React.Dispatch<React.SetStateAction<MyTasksFilters>>;
  setIsCardSettingsOpen: (open: boolean) => void;
  setIsStageFilterOpen: (open: boolean) => void;
  setShowNetworkDiagnostics: (open: boolean) => void;
  toggleStageSelection: (stageId: string) => void;
  updateTaskBoardPreferences: (updates: Partial<TaskBoardPreferences>) => void;
}
