export interface AvatarV1PermissionUser {
  id: string;
  role?: string | null;
}

export interface AvatarV1EditPermissions {
  hasGlobalEditPermission: boolean;
  hasOwnEditPermission: boolean;
}

export function canUploadAvatarForApplicant({
  applicantRecruiterId,
  hasGlobalEditPermission,
  hasOwnEditPermission,
  user,
}: AvatarV1EditPermissions & {
  applicantRecruiterId: string | null;
  user: AvatarV1PermissionUser;
}) {
  return user.role === 'Admin' ||
    hasGlobalEditPermission ||
    (hasOwnEditPermission && applicantRecruiterId === user.id);
}

export function canUploadAvatarWithAnyApplicantScope(
  user: AvatarV1PermissionUser,
  permissions: AvatarV1EditPermissions
) {
  return user.role === 'Admin' ||
    permissions.hasGlobalEditPermission ||
    permissions.hasOwnEditPermission;
}
