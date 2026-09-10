import type { PlatformModuleId } from '@/lib/types';
import { expandPermissionSet, permissionMatches } from '@/lib/permission-aliases';
import { isAdminRole } from '@/lib/auth-config-utils';

export interface SessionLikeUser {
  modulePermissions?: PlatformModuleId[];
  role?: string;
}

export function isAdminUser(user: SessionLikeUser | null | undefined) {
  return isAdminRole(user?.role);
}

export function hasPermission(user: SessionLikeUser | null | undefined, permission: PlatformModuleId): boolean {
  if (!user) return false;
  if (isAdminUser(user)) return true;

  return permissionMatches(user.modulePermissions, permission);
}

export function hasAnyPermission(user: SessionLikeUser | null | undefined, required: PlatformModuleId[]): boolean {
  if (!user) return false;
  if (isAdminUser(user)) return true;

  const perms = expandPermissionSet(user.modulePermissions);
  return required.some(permission => permissionMatches(perms, permission));
}

export function hasAllPermissions(user: SessionLikeUser | null | undefined, required: PlatformModuleId[]): boolean {
  if (!user) return false;
  if (isAdminUser(user)) return true;

  const perms = expandPermissionSet(user.modulePermissions);
  return required.every(permission => permissionMatches(perms, permission));
}

export function checkPermission(
  userRole: string,
  modulePermissions: PlatformModuleId[],
  permissionId: PlatformModuleId
): boolean {
  if (isAdminRole(userRole)) return true;

  return permissionMatches(modulePermissions, permissionId);
}
