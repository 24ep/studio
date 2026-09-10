const APPLICANT_PERMISSION_ALIASES: Array<[string, string]> = [
  ['applicantS_VIEW', 'APPLICANTS_VIEW'],
  ['applicantS_VIEW_ALL', 'APPLICANTS_VIEW_ALL'],
  ['applicantS_VIEW_DETAILED', 'APPLICANTS_VIEW_DETAILED'],
  ['applicantS_CREATE', 'APPLICANTS_CREATE'],
  ['applicantS_EDIT_BASIC', 'APPLICANTS_EDIT_BASIC'],
  ['applicantS_EDIT_BASIC_OWN', 'APPLICANTS_EDIT_BASIC_OWN'],
  ['applicantS_EDIT_BASIC_ALL', 'APPLICANTS_EDIT_BASIC_ALL'],
  ['applicantS_EDIT_SENSITIVE', 'APPLICANTS_EDIT_SENSITIVE'],
  ['applicantS_EDIT_SENSITIVE_OWN', 'APPLICANTS_EDIT_SENSITIVE_OWN'],
  ['applicantS_EDIT_SENSITIVE_ALL', 'APPLICANTS_EDIT_SENSITIVE_ALL'],
  ['applicantS_DELETE', 'APPLICANTS_DELETE'],
  ['applicantS_RESUMES_UPLOAD', 'APPLICANTS_RESUMES_UPLOAD'],
  ['applicantS_RESUMES_UPLOAD_OWN', 'APPLICANTS_RESUMES_UPLOAD_OWN'],
  ['applicantS_RESUMES_UPLOAD_ALL', 'APPLICANTS_RESUMES_UPLOAD_ALL'],
  ['applicantS_RESUMES_DELETE', 'APPLICANTS_RESUMES_DELETE'],
  ['applicantS_COMMENTS_VIEW', 'APPLICANTS_COMMENTS_VIEW'],
  ['applicantS_COMMENTS_ADD', 'APPLICANTS_COMMENTS_ADD'],
  ['applicantS_COMMENTS_ADD_OWN', 'APPLICANTS_COMMENTS_ADD_OWN'],
  ['applicantS_COMMENTS_ADD_ALL', 'APPLICANTS_COMMENTS_ADD_ALL'],
  ['applicantS_COMMENTS_EDIT', 'APPLICANTS_COMMENTS_EDIT'],
  ['applicantS_COMMENTS_VIEW_REMARK_ONLY', 'APPLICANTS_COMMENTS_VIEW_REMARK_ONLY'],
  ['applicantS_ACTIVITIES_VIEW', 'APPLICANTS_ACTIVITIES_VIEW'],
  ['applicantS_SOURCE_ASSIGN', 'APPLICANTS_SOURCE_ASSIGN'],
  ['applicantS_SOURCE_ASSIGN_BULK', 'APPLICANTS_SOURCE_ASSIGN_BULK'],
  ['applicantS_RECRUITER_ASSIGN', 'APPLICANTS_RECRUITER_ASSIGN'],
  ['applicantS_RECRUITER_ASSIGN_OWN', 'APPLICANTS_RECRUITER_ASSIGN_OWN'],
  ['applicantS_RECRUITER_ASSIGN_ALL', 'APPLICANTS_RECRUITER_ASSIGN_ALL'],
  ['applicantS_RECRUITER_ASSIGN_BULK', 'APPLICANTS_RECRUITER_ASSIGN_BULK'],
  ['applicantS_PIPELINE_STAGE_UPDATE', 'APPLICANTS_PIPELINE_STAGE_UPDATE'],
  ['applicantS_PIPELINE_STAGE_UPDATE_OWN', 'APPLICANTS_PIPELINE_STAGE_UPDATE_OWN'],
  ['applicantS_PIPELINE_STAGE_UPDATE_ALL', 'APPLICANTS_PIPELINE_STAGE_UPDATE_ALL'],
  ['applicantS_PIPELINE_STAGE_BULK_UPDATE', 'APPLICANTS_PIPELINE_STAGE_BULK_UPDATE'],
  ['applicantS_IMPORT', 'APPLICANTS_IMPORT'],
  ['applicantS_EXPORT', 'APPLICANTS_EXPORT'],
];

const PERMISSION_ALIASES = new Map<string, string[]>();

for (const [canonicalPermission, legacyPermission] of APPLICANT_PERMISSION_ALIASES) {
  const canonicalAliases = PERMISSION_ALIASES.get(canonicalPermission) || [];
  canonicalAliases.push(legacyPermission);
  PERMISSION_ALIASES.set(canonicalPermission, canonicalAliases);

  const legacyAliases = PERMISSION_ALIASES.get(legacyPermission) || [];
  legacyAliases.push(canonicalPermission);
  PERMISSION_ALIASES.set(legacyPermission, legacyAliases);
}

export function getPermissionAliases(permission: string): string[] {
  return PERMISSION_ALIASES.get(permission) || [];
}

export function expandPermissionSet<T extends string>(permissions: readonly T[] | null | undefined): T[] {
  if (!Array.isArray(permissions) || permissions.length === 0) {
    return [];
  }

  const expandedPermissions = new Set<string>();

  for (const permission of permissions) {
    expandedPermissions.add(permission);

    for (const alias of getPermissionAliases(permission)) {
      expandedPermissions.add(alias);
    }
  }

  return Array.from(expandedPermissions) as T[];
}

export function permissionMatches(
  permissions: readonly string[] | null | undefined,
  requestedPermission: string
): boolean {
  if (!Array.isArray(permissions) || permissions.length === 0) {
    return false;
  }

  if (permissions.includes(requestedPermission)) {
    return true;
  }

  return getPermissionAliases(requestedPermission).some(alias => permissions.includes(alias));
}
