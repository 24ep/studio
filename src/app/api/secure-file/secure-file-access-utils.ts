export type SecureFileSessionUser = {
  id: string;
  role?: string;
  modulePermissions?: string[];
};

export function canAccessApplicantFile(user: SecureFileSessionUser, recruiterId: string | null) {
  const hasGlobalEditPermission = hasGlobalApplicantEdit(user);
  const hasOwnEditPermission = hasOwnApplicantEdit(user);

  if (user.role === 'Admin' || hasGlobalEditPermission) {
    return true;
  }

  return Boolean(hasOwnEditPermission && recruiterId === user.id);
}

export function canAccessHeadcountFile(user: SecureFileSessionUser, recruiterId: string | null | undefined) {
  const hasGlobalEditPermission = hasGlobalPositionEdit(user);
  const hasOwnEditPermission = hasOwnPositionEdit(user);

  if (user.role === 'Admin' || hasGlobalEditPermission) {
    return true;
  }

  return Boolean(hasOwnEditPermission && recruiterId === user.id);
}

export function hasApplicantEditPermission(user: SecureFileSessionUser) {
  return user.role === 'Admin' || hasGlobalApplicantEdit(user) || hasOwnApplicantEdit(user);
}

export function hasPositionEditPermission(user: SecureFileSessionUser) {
  return user.role === 'Admin' || hasGlobalPositionEdit(user) || hasOwnPositionEdit(user);
}

function hasGlobalApplicantEdit(user: SecureFileSessionUser) {
  return user.modulePermissions?.includes('applicantS_EDIT_BASIC')
    || user.modulePermissions?.includes('applicantS_EDIT_SENSITIVE');
}

function hasOwnApplicantEdit(user: SecureFileSessionUser) {
  return user.modulePermissions?.includes('applicantS_EDIT_BASIC_OWN')
    || user.modulePermissions?.includes('applicantS_EDIT_SENSITIVE_OWN');
}

function hasGlobalPositionEdit(user: SecureFileSessionUser) {
  return user.modulePermissions?.includes('POSITIONS_EDIT_BASIC')
    || user.modulePermissions?.includes('POSITIONS_EDIT_SENSITIVE');
}

function hasOwnPositionEdit(user: SecureFileSessionUser) {
  return user.modulePermissions?.includes('POSITIONS_EDIT_BASIC_OWN')
    || user.modulePermissions?.includes('POSITIONS_EDIT_SENSITIVE_OWN');
}
