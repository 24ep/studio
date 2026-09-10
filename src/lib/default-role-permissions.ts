import { PLATFORM_MODULES } from './types';

export const ADMIN_DEFAULT_PERMISSIONS = PLATFORM_MODULES.map((module) => module.id) as readonly string[];

export const RECRUITER_DEFAULT_PERMISSIONS = [
  'applicantS_VIEW',
  'applicantS_VIEW_DETAILED',
  'applicantS_CREATE',
  'applicantS_EDIT_BASIC',
  'applicantS_EDIT_BASIC_OWN',
  'applicantS_EDIT_BASIC_ALL',
  'applicantS_EDIT_SENSITIVE_OWN',
  'applicantS_EDIT_SENSITIVE_ALL',
  'applicantS_SOURCE_ASSIGN',
  'applicantS_RECRUITER_ASSIGN',
  'applicantS_RECRUITER_ASSIGN_OWN',
  'applicantS_RECRUITER_ASSIGN_ALL',
  'applicantS_PIPELINE_STAGE_UPDATE',
  'applicantS_PIPELINE_STAGE_UPDATE_OWN',
  'applicantS_PIPELINE_STAGE_UPDATE_ALL',
  'applicantS_RESUMES_UPLOAD',
  'applicantS_RESUMES_UPLOAD_OWN',
  'applicantS_RESUMES_UPLOAD_ALL',
  'applicantS_COMMENTS_VIEW',
  'applicantS_COMMENTS_ADD',
  'applicantS_COMMENTS_ADD_OWN',
  'applicantS_COMMENTS_ADD_ALL',
  'applicantS_IMPORT',
  'applicantS_EXPORT',
  'applicantS_ACTIVITIES_VIEW',
  'POSITIONS_VIEW',
  'POSITIONS_CREATE',
  'POSITIONS_EDIT_BASIC',
  'POSITIONS_RECRUITER_ASSIGN',
  'POSITIONS_IMPORT',
  'POSITIONS_EXPORT',
  'TASK_BOARD_VIEW',
  'TASK_BOARD_MANAGE_OWN',
  'RECRUITMENT_STAGES_VIEW',
  'USER_PREFERENCES_MANAGE_OWN',
  'BULK_UPLOAD_EXECUTE',
  'DASHBOARD_VIEW',
  'REPORTS_GENERATE',
] as const;

export const DEFAULT_ROLE_PERMISSIONS: Record<string, readonly string[]> = {
  Admin: ADMIN_DEFAULT_PERMISSIONS,
  Recruiter: RECRUITER_DEFAULT_PERMISSIONS,
  'Recruiter Manager': [
    'applicantS_VIEW', 'applicantS_VIEW_ALL', 'applicantS_VIEW_DETAILED', 'applicantS_CREATE', 'applicantS_EDIT_BASIC', 'applicantS_EDIT_SENSITIVE', 'applicantS_EDIT_BASIC_ALL', 'applicantS_EDIT_SENSITIVE_ALL', 'applicantS_SOURCE_ASSIGN', 'applicantS_SOURCE_ASSIGN_BULK', 'applicantS_RECRUITER_ASSIGN', 'applicantS_RECRUITER_ASSIGN_BULK', 'applicantS_RECRUITER_ASSIGN_ALL', 'applicantS_PIPELINE_STAGE_UPDATE', 'applicantS_PIPELINE_STAGE_BULK_UPDATE', 'applicantS_PIPELINE_STAGE_UPDATE_ALL', 'applicantS_RESUMES_UPLOAD', 'applicantS_RESUMES_UPLOAD_ALL', 'applicantS_RESUMES_DELETE', 'applicantS_COMMENTS_VIEW', 'applicantS_COMMENTS_ADD', 'applicantS_COMMENTS_ADD_ALL', 'applicantS_COMMENTS_EDIT', 'applicantS_IMPORT', 'applicantS_EXPORT', 'applicantS_ACTIVITIES_VIEW',
    'POSITIONS_VIEW', 'POSITIONS_VIEW_ALL', 'POSITIONS_CREATE', 'POSITIONS_EDIT_BASIC', 'POSITIONS_EDIT_DETAILED', 'POSITIONS_RECRUITER_ASSIGN', 'POSITIONS_IMPORT', 'POSITIONS_EXPORT',
    'TASK_BOARD_VIEW', 'TASK_BOARD_MANAGE_ALL', 'RECRUITMENT_STAGES_VIEW', 'USER_PREFERENCES_MANAGE_OWN', 'USER_PREFERENCES_MANAGE_ALL', 'BULK_UPLOAD_EXECUTE', 'DASHBOARD_VIEW', 'REPORTS_GENERATE', 'WEBHOOK_ANALYTICS_VIEW'
  ],
  'Hiring Manager': [
    'applicantS_VIEW', 'applicantS_VIEW_DETAILED', 'applicantS_COMMENTS_VIEW_REMARK_ONLY', 'POSITIONS_VIEW', 'TASK_BOARD_VIEW', 'DASHBOARD_VIEW', 'USER_PREFERENCES_MANAGE_OWN'
  ],
  Employee: [
    'USER_PREFERENCES_MANAGE_OWN'
  ],
  'Pre-Registered User': [
    'USER_PREFERENCES_MANAGE_OWN', 'ROLES_MANAGE'
  ]
};

export function getDefaultPermissionsForRole(roleName: string): string[] | null {
  const permissions = DEFAULT_ROLE_PERMISSIONS[roleName];
  return permissions ? [...permissions] : null;
}

export function hasDefaultPermissionsTemplate(roleName: string): boolean {
  return roleName in DEFAULT_ROLE_PERMISSIONS;
}
