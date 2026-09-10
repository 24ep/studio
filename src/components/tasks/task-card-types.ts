export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface TaskSkill {
  skill_string?: string;
  segment_skill?: string;
  [key: string]: unknown;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority?: TaskPriority;
  assignee?: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  dueDate?: string;
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
  fitScore?: number;
  avatarUrl?: string;
  email?: string;
  skills?: TaskSkill[];
  originalapplicant?: unknown;
  [key: string]: unknown;
}

export interface TaskCardPreferences {
  cardWidth: 'narrow' | 'medium' | 'wide' | 'custom';
  customCardWidth?: number;
  showAvatar: boolean;
  showName: boolean;
  showEmail: boolean;
  showFitScore: boolean;
  showAssignee: boolean;
  showSkills: boolean;
  showJobApplied: boolean;
}
