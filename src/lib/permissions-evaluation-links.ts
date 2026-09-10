import type { PlatformModuleId } from '@/lib/types';
import { expandPermissionSet, permissionMatches } from '@/lib/permission-aliases';

import { isAdminUser, type SessionLikeUser } from './permissions-core';

function hasAnyExpandedPermission(
  permissions: PlatformModuleId[] | undefined,
  required: PlatformModuleId[]
) {
  const expanded = expandPermissionSet(permissions);
  return required.some(permission => permissionMatches(expanded, permission));
}

export function canViewEvaluationLinks(
  user: SessionLikeUser | null | undefined
): { canView: boolean; reason?: string } {
  if (!user) {
    return { canView: false, reason: 'User not authenticated' };
  }

  if (isAdminUser(user)) {
    return { canView: true };
  }

  if (hasAnyExpandedPermission(user.modulePermissions, [
    'EVALUATION_LINKS_VIEW',
    'EVALUATION_LINKS_CREATE_OWN',
    'EVALUATION_LINKS_CREATE_ALL',
    'EVALUATION_LINKS_MANAGE_OWN',
    'EVALUATION_LINKS_MANAGE_ALL',
  ])) {
    return { canView: true };
  }

  return {
    canView: false,
    reason: 'No permission to view evaluation links',
  };
}

export function canCreateEvaluationLink(
  user: SessionLikeUser | null | undefined,
  applicantRecruiterId: string | null | undefined,
  userId: string
): { canCreate: boolean; reason?: string } {
  if (!user) {
    return { canCreate: false, reason: 'User not authenticated' };
  }

  if (isAdminUser(user)) {
    return { canCreate: true };
  }

  const perms = expandPermissionSet(user.modulePermissions);
  if (permissionMatches(perms, 'EVALUATION_LINKS_CREATE_ALL')) {
    return { canCreate: true };
  }

  const isOwnApplicant = applicantRecruiterId === userId;
  if (isOwnApplicant && permissionMatches(perms, 'EVALUATION_LINKS_CREATE_OWN')) {
    return { canCreate: true };
  }

  return {
    canCreate: false,
    reason: isOwnApplicant
      ? 'No permission to create evaluation links for own assigned Applicants'
      : 'No permission to create evaluation links for Applicants assigned to others',
  };
}

export function canManageEvaluationLink(
  user: SessionLikeUser | null | undefined,
  linkCreatedById: string | null | undefined,
  userId: string
): { canManage: boolean; reason?: string } {
  if (!user) {
    return { canManage: false, reason: 'User not authenticated' };
  }

  if (isAdminUser(user)) {
    return { canManage: true };
  }

  const perms = expandPermissionSet(user.modulePermissions);
  if (permissionMatches(perms, 'EVALUATION_LINKS_MANAGE_ALL')) {
    return { canManage: true };
  }

  const isOwnLink = linkCreatedById === userId;
  if (isOwnLink && permissionMatches(perms, 'EVALUATION_LINKS_MANAGE_OWN')) {
    return { canManage: true };
  }

  return {
    canManage: false,
    reason: isOwnLink
      ? 'No permission to manage own created evaluation links'
      : 'No permission to manage evaluation links created by others',
  };
}
