export interface TaskStage {
  id: string;
  name: string;
  description?: string;
  color?: string;
  sortOrder?: number;
}

export interface TaskBoardCardPreferences {
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
