import { permissionMatches } from '../../../../lib/permission-aliases';

export type EvaluationPermissionUser = {
  id?: string | null;
  role?: string | null;
  modulePermissions?: unknown;
} | null | undefined;

function getUserPermissions(user: EvaluationPermissionUser) {
  return Array.isArray(user?.modulePermissions) ? user.modulePermissions : [];
}

export function canEditEvaluationScores(user: EvaluationPermissionUser, applicantRecruiterId?: string | null) {
  if (!user) return false;
  if (user.role === 'Admin') return true;

  const permissions = getUserPermissions(user);
  if (
    permissionMatches(permissions, 'APPLICANTS_EDIT_SENSITIVE') ||
    permissionMatches(permissions, 'APPLICANTS_EDIT_SENSITIVE_ALL')
  ) {
    return true;
  }

  return Boolean(
    applicantRecruiterId &&
    user.id === applicantRecruiterId &&
    permissionMatches(permissions, 'APPLICANTS_EDIT_SENSITIVE_OWN')
  );
}

export function canEditEvaluationAttachments(user: EvaluationPermissionUser, applicantRecruiterId?: string | null) {
  if (!user) return false;
  if (user.role === 'Admin') return true;

  const permissions = getUserPermissions(user);
  if (
    permissionMatches(permissions, 'APPLICANTS_EDIT_BASIC') ||
    permissionMatches(permissions, 'APPLICANTS_EDIT_SENSITIVE') ||
    permissionMatches(permissions, 'APPLICANTS_EDIT_SENSITIVE_ALL')
  ) {
    return true;
  }

  return Boolean(
    applicantRecruiterId &&
    user.id === applicantRecruiterId &&
    (
      permissionMatches(permissions, 'APPLICANTS_EDIT_BASIC_OWN') ||
      permissionMatches(permissions, 'APPLICANTS_EDIT_SENSITIVE_OWN')
    )
  );
}

export function canResetApplicantEvaluation(user: EvaluationPermissionUser) {
  if (!user) return false;
  if (user.role === 'Admin') return true;

  const permissions = getUserPermissions(user);
  return (
    permissionMatches(permissions, 'APPLICANTS_EDIT_SENSITIVE') ||
    permissionMatches(permissions, 'APPLICANTS_EDIT_SENSITIVE_ALL')
  );
}

export function canRemoveEvaluationInterviewer(user: EvaluationPermissionUser) {
  if (!user) return false;
  if (user.role === 'Admin') return true;

  const permissions = getUserPermissions(user);
  return permissions.includes('POSITIONS_EDIT_BASIC') || permissions.includes('POSITIONS_EDIT_DETAILED');
}
