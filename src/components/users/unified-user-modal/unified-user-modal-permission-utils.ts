import type { ModalMode } from './types';

export interface UnifiedUserPermissionModel {
  canManageAuthentication: boolean;
  canManageTeams: boolean;
  canManageUsers: boolean;
  canForcePasswordChange: boolean;
  isEditingSelf: boolean;
}

export function buildUnifiedUserPermissionModel({
  hasUserManagePermission,
  mode,
  sessionUserId,
  userId,
}: {
  hasUserManagePermission: boolean;
  mode: ModalMode;
  sessionUserId?: string | null;
  userId?: string | null;
}): UnifiedUserPermissionModel {
  const isEditingSelf = !!userId && userId === sessionUserId;

  return {
    canManageAuthentication: hasUserManagePermission,
    canManageTeams: hasUserManagePermission,
    canManageUsers: hasUserManagePermission,
    canForcePasswordChange: hasUserManagePermission && mode === 'edit' && !isEditingSelf,
    isEditingSelf,
  };
}

export function shouldFetchUnifiedUserTeams({
  canManageTeams,
  mode,
}: {
  canManageTeams: boolean;
  mode: ModalMode;
}) {
  return canManageTeams || mode === 'profile';
}
