import type { PlatformModuleId } from '@/lib/types';
import { expandPermissionSet, permissionMatches } from '@/lib/permission-aliases';

import { isAdminUser, type SessionLikeUser } from './permissions-core';

type PermissionResult<Key extends string> = Record<Key, boolean> & {
  reason?: string;
};

interface OwnershipPermissionInput<Key extends string> {
  applicantRecruiterId: string | null | undefined;
  deniedOtherReason: string;
  deniedOwnReason: string;
  globalPermissions: PlatformModuleId[];
  ownPermissions: PlatformModuleId[];
  resultKey: Key;
  unauthenticatedReason: string;
  user: SessionLikeUser | null | undefined;
  userId: string;
}

function ownershipPermissionResult<Key extends string>(
  key: Key,
  allowed: boolean,
  reason?: string
): PermissionResult<Key> {
  return {
    [key]: allowed,
    ...(reason ? { reason } : {}),
  } as PermissionResult<Key>;
}

function checkOwnershipPermission<Key extends string>({
  applicantRecruiterId,
  deniedOtherReason,
  deniedOwnReason,
  globalPermissions,
  ownPermissions,
  resultKey,
  unauthenticatedReason,
  user,
  userId,
}: OwnershipPermissionInput<Key>): PermissionResult<Key> {
  if (!user) {
    return ownershipPermissionResult(resultKey, false, unauthenticatedReason);
  }

  if (isAdminUser(user)) {
    return ownershipPermissionResult(resultKey, true);
  }

  const perms = expandPermissionSet(user.modulePermissions);
  if (globalPermissions.some(permission => permissionMatches(perms, permission))) {
    return ownershipPermissionResult(resultKey, true);
  }

  const isOwnApplicant = applicantRecruiterId === userId;
  if (isOwnApplicant && ownPermissions.some(permission => permissionMatches(perms, permission))) {
    return ownershipPermissionResult(resultKey, true);
  }

  return ownershipPermissionResult(
    resultKey,
    false,
    isOwnApplicant ? deniedOwnReason : deniedOtherReason
  );
}

export function canEditApplicant(
  user: SessionLikeUser | null | undefined,
  applicantRecruiterId: string | null | undefined,
  userId: string
) {
  return checkOwnershipPermission({
    applicantRecruiterId,
    deniedOtherReason: 'No edit permissions for Applicants assigned to others',
    deniedOwnReason: 'No edit permissions for own assigned Applicants',
    globalPermissions: ['applicantS_EDIT_BASIC', 'applicantS_EDIT_BASIC_ALL', 'applicantS_EDIT_SENSITIVE', 'applicantS_EDIT_SENSITIVE_ALL'],
    ownPermissions: ['applicantS_EDIT_BASIC_OWN', 'applicantS_EDIT_SENSITIVE_OWN'],
    resultKey: 'canEdit',
    unauthenticatedReason: 'User not authenticated',
    user,
    userId,
  });
}

export function canUpdateApplicantPipelineStage(
  user: SessionLikeUser | null | undefined,
  applicantRecruiterId: string | null | undefined,
  userId: string
) {
  return checkOwnershipPermission({
    applicantRecruiterId,
    deniedOtherReason: 'No pipeline update permissions for Applicants assigned to others',
    deniedOwnReason: 'No pipeline update permissions for own assigned Applicants',
    globalPermissions: ['applicantS_PIPELINE_STAGE_UPDATE', 'applicantS_PIPELINE_STAGE_UPDATE_ALL'],
    ownPermissions: ['applicantS_PIPELINE_STAGE_UPDATE_OWN'],
    resultKey: 'canUpdate',
    unauthenticatedReason: 'User not authenticated',
    user,
    userId,
  });
}

export function canAssignRecruiter(
  user: SessionLikeUser | null | undefined,
  applicantRecruiterId: string | null | undefined,
  userId: string
) {
  return checkOwnershipPermission({
    applicantRecruiterId,
    deniedOtherReason: 'No recruiter assignment permissions for Applicants assigned to others',
    deniedOwnReason: 'No recruiter assignment permissions for own assigned Applicants',
    globalPermissions: ['applicantS_RECRUITER_ASSIGN', 'applicantS_RECRUITER_ASSIGN_ALL'],
    ownPermissions: ['applicantS_RECRUITER_ASSIGN_OWN'],
    resultKey: 'canAssign',
    unauthenticatedReason: 'User not authenticated',
    user,
    userId,
  });
}

export function canAddComments(
  user: SessionLikeUser | null | undefined,
  applicantRecruiterId: string | null | undefined,
  userId: string
) {
  return checkOwnershipPermission({
    applicantRecruiterId,
    deniedOtherReason: 'No comment permissions for Applicants assigned to others',
    deniedOwnReason: 'No comment permissions for own assigned Applicants',
    globalPermissions: ['applicantS_COMMENTS_ADD', 'applicantS_COMMENTS_ADD_ALL'],
    ownPermissions: ['applicantS_COMMENTS_ADD_OWN'],
    resultKey: 'canAdd',
    unauthenticatedReason: 'User not authenticated',
    user,
    userId,
  });
}

export function canUploadResumes(
  user: SessionLikeUser | null | undefined,
  applicantRecruiterId: string | null | undefined,
  userId: string
) {
  return checkOwnershipPermission({
    applicantRecruiterId,
    deniedOtherReason: 'No resume upload permissions for Applicants assigned to others',
    deniedOwnReason: 'No resume upload permissions for own assigned Applicants',
    globalPermissions: ['applicantS_RESUMES_UPLOAD', 'applicantS_RESUMES_UPLOAD_ALL'],
    ownPermissions: ['applicantS_RESUMES_UPLOAD_OWN'],
    resultKey: 'canUpload',
    unauthenticatedReason: 'User not authenticated',
    user,
    userId,
  });
}
