import type { PreviewSessionUser } from './secure-file-preview-auth';

export interface PreviewEditPermissions {
  global: boolean;
  own: boolean;
}

export function getApplicantPreviewEditPermissions(user: PreviewSessionUser): PreviewEditPermissions {
  return {
    global:
      user.modulePermissions?.includes('applicantS_EDIT_BASIC') ||
      user.modulePermissions?.includes('applicantS_EDIT_SENSITIVE') ||
      false,
    own:
      user.modulePermissions?.includes('applicantS_EDIT_BASIC_OWN') ||
      user.modulePermissions?.includes('applicantS_EDIT_SENSITIVE_OWN') ||
      false,
  };
}

export function getPositionPreviewEditPermissions(user: PreviewSessionUser): PreviewEditPermissions {
  return {
    global:
      user.modulePermissions?.includes('POSITIONS_EDIT_BASIC') ||
      user.modulePermissions?.includes('POSITIONS_EDIT_SENSITIVE') ||
      false,
    own:
      user.modulePermissions?.includes('POSITIONS_EDIT_BASIC_OWN') ||
      user.modulePermissions?.includes('POSITIONS_EDIT_SENSITIVE_OWN') ||
      false,
  };
}

export function canAccessOwnedPreviewResource(
  user: PreviewSessionUser,
  ownerId: string | null | undefined,
  permissions: PreviewEditPermissions
) {
  return user.role === 'Admin' ||
    permissions.global ||
    (permissions.own && ownerId === user.id);
}
