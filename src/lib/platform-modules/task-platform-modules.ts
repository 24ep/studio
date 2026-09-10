import { PLATFORM_MODULE_CATEGORIES, type PlatformModule } from './platform-module-types';

export const TASK_PLATFORM_MODULES: PlatformModule[] = [
  // ===== TASK MANAGEMENT =====

  {
    id: 'TASK_BOARD_VIEW',
    label: 'View Task Board',
    category: PLATFORM_MODULE_CATEGORIES.APPLICANT_MANAGEMENT,
    description: "View task board and workflow",
    detailedDescription: "Access to view the task board for managing Applicant tasks and workflow.",
    impact: "Read-only access to task management. No ability to modify tasks.",
    riskLevel: 'LOW'
  },

  {
    id: 'TASK_BOARD_MANAGE_OWN',
    label: 'Manage Own Tasks',
    category: PLATFORM_MODULE_CATEGORIES.APPLICANT_MANAGEMENT,
    description: "Manage tasks assigned to self",
    detailedDescription: "Ability to create, edit, and complete tasks assigned to the current user.",
    impact: "Can manage personal task workflow. Limited to own tasks only.",
    riskLevel: 'LOW'
  },

  {
    id: 'TASK_BOARD_MANAGE_ALL',
    label: 'Manage All Tasks',
    category: PLATFORM_MODULE_CATEGORIES.APPLICANT_MANAGEMENT,
    description: "Manage tasks for all users",
    detailedDescription: "Ability to create, edit, assign, and manage tasks for all users in the system.",
    impact: "Can control task workflow for all users. Affects team productivity and coordination.",
    riskLevel: 'HIGH'
  },

];
