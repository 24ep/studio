import type { TaskSkill } from "@/components/tasks/TaskCard";

export interface MyTasksFilters {
  name?: string;
  positionId?: string;
  stage?: string | string[];
  recruiterId?: string;
  minFitScore?: number;
  maxFitScore?: number;
  fitScoreGrades?: string[];
  applicationDateStart?: string;
  applicationDateEnd?: string;
  assignmentStatus?: "assigned" | "unassigned" | string;
  positionStatus?: "with-position" | "without-position" | string;
  scoreStatus?: "scored" | "unscored" | string;
  [key: string]: unknown;
}

export interface TaskboardApplicant {
  id: string;
  name?: string;
  email?: string;
  status?: string;
  statusId?: string;
  fitScore?: number | null;
  parsedData?: {
    summary?: string;
    skills?: TaskSkill[];
    [key: string]: unknown;
  } | null;
  recruiter?: {
    id: string;
    name: string;
    avatarUrl?: string;
  } | null;
  recruiterId?: string | null;
  position?: {
    title?: string;
  } | null;
  positionId?: string | null;
  applicationDate?: string;
  createdAt?: string;
  updatedAt?: string;
  avatarUrl?: string;
  [key: string]: unknown;
}

export interface MyTasksRecruiter {
  id: string;
  name?: string;
  avatarUrl?: string;
  personalColor?: string;
}

export interface TaskboardStageResponse {
  id?: unknown;
  name?: unknown;
  description?: unknown;
  sort_order?: unknown;
  color_complete?: unknown;
  color_badge?: unknown;
  is_system?: unknown;
}

export interface MyTasksStage {
  id: string;
  name: string;
  description?: string;
  sortOrder?: number;
  colorComplete?: string;
  colorBadge?: string;
  isSystem?: boolean;
}
