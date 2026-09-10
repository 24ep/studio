import { type NextRequest } from 'next/server';
import { verifyApiToken } from '@/lib/auth';
import {
  SimpleErrorHandler,
  createForbiddenError,
  createNotFoundError,
  createUnauthorizedError,
} from '@/lib/errors';
import { canEditApplicant, canUploadResumes } from '@/lib/permissions';
import { permissionMatches } from '@/lib/permission-aliases';
import prisma from '@/lib/prisma';

export type AttachmentRouteUser = {
  id: string;
  role?: string;
  modulePermissions?: string[];
};

export type AttachmentApplicantAccessRow = {
  id: string;
  recruiterId: string | null;
};

type ScopedPermissionResult = {
  canAccess?: boolean;
  canEdit?: boolean;
  canUpload?: boolean;
  reason?: string;
};

type AttachmentPermissionSet = {
  global: boolean;
  own: boolean;
};

type ScopedPermissionChecker = (
  user: AttachmentRouteUser,
  applicant: AttachmentApplicantAccessRow
) => ScopedPermissionResult;

export async function requireAttachmentRouteUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.split(' ')[1];
  const user = token ? await verifyApiToken(token) as AttachmentRouteUser | null : null;

  return user
    ? { ok: true as const, user }
    : {
        ok: false as const,
        response: SimpleErrorHandler.handleApiError(request, createUnauthorizedError('Authentication required')),
      };
}

export async function fetchAttachmentApplicant(applicantId: string) {
  return await prisma.applicant.findUnique({
    where: { id: applicantId },
    select: { id: true, recruiterId: true },
  });
}

export async function requireAttachmentApplicant(request: NextRequest, applicantId: string) {
  const applicant = await fetchAttachmentApplicant(applicantId);
  return applicant
    ? { ok: true as const, applicant }
    : {
        ok: false as const,
        response: SimpleErrorHandler.handleApiError(request, createNotFoundError('Applicant not found')),
      };
}

export function getAttachmentEditPermissions(user: AttachmentRouteUser) {
  return {
    hasGlobalEditPermission:
      permissionMatches(user.modulePermissions, 'APPLICANTS_EDIT_BASIC')
      || permissionMatches(user.modulePermissions, 'APPLICANTS_EDIT_SENSITIVE'),
    hasOwnEditPermission:
      permissionMatches(user.modulePermissions, 'APPLICANTS_EDIT_BASIC_OWN')
      || permissionMatches(user.modulePermissions, 'APPLICANTS_EDIT_SENSITIVE_OWN'),
  };
}

export function getAttachmentUploadPermissions(user: AttachmentRouteUser) {
  return {
    hasGlobalResumePermission: permissionMatches(user.modulePermissions, 'APPLICANTS_RESUMES_UPLOAD'),
    hasOwnResumePermission: permissionMatches(user.modulePermissions, 'APPLICANTS_RESUMES_UPLOAD_OWN'),
  };
}

export function validateAttachmentViewAccess(request: NextRequest, user: AttachmentRouteUser, applicant: AttachmentApplicantAccessRow) {
  return validateAttachmentEditAccess(request, user, applicant, 'Insufficient permissions to view attachments');
}

export function validateAttachmentManageAccess(request: NextRequest, user: AttachmentRouteUser, applicant: AttachmentApplicantAccessRow) {
  return validateAttachmentEditAccess(request, user, applicant, 'Insufficient permissions to manage attachments');
}

export function validateAttachmentDeleteAccess(request: NextRequest, user: AttachmentRouteUser, applicant: AttachmentApplicantAccessRow) {
  return validateAttachmentEditAccess(request, user, applicant, 'Insufficient permissions to delete attachments');
}

export function validateAttachmentUploadAccess(request: NextRequest, user: AttachmentRouteUser, applicant: AttachmentApplicantAccessRow) {
  const permissions = getAttachmentUploadPermissions(user);
  return validateScopedAttachmentAccess(request, user, applicant, {
    global: permissions.hasGlobalResumePermission,
    own: permissions.hasOwnResumePermission,
  }, 'Insufficient permissions to upload attachments', (scopedUser, scopedApplicant) => (
    canUploadResumes(scopedUser, scopedApplicant.recruiterId, scopedUser.id)
  ));
}

export function validateInitialAttachmentUploadAccess(request: NextRequest, user: AttachmentRouteUser) {
  const permissions = getAttachmentUploadPermissions(user);
  if (user.role !== 'Admin' && !permissions.hasGlobalResumePermission && !permissions.hasOwnResumePermission) {
    return SimpleErrorHandler.handleApiError(request, createForbiddenError('Insufficient permissions to upload attachments'));
  }

  return null;
}

function validateAttachmentEditAccess(
  request: NextRequest,
  user: AttachmentRouteUser,
  applicant: AttachmentApplicantAccessRow,
  insufficientMessage: string
) {
  const permissions = getAttachmentEditPermissions(user);
  return validateScopedAttachmentAccess(request, user, applicant, {
    global: permissions.hasGlobalEditPermission,
    own: permissions.hasOwnEditPermission,
  }, insufficientMessage, (scopedUser, scopedApplicant) => (
    canEditApplicant(scopedUser, scopedApplicant.recruiterId, scopedUser.id)
  ));
}

function validateScopedAttachmentAccess(
  request: NextRequest,
  user: AttachmentRouteUser,
  applicant: AttachmentApplicantAccessRow,
  permissions: AttachmentPermissionSet,
  insufficientMessage: string,
  scopedPermission: ScopedPermissionChecker
) {
  if (user.role === 'Admin' || permissions.global) {
    return null;
  }

  if (!permissions.own) {
    return SimpleErrorHandler.handleApiError(request, createForbiddenError(insufficientMessage));
  }

  const permission = scopedPermission(user, applicant);
  if (permission.canAccess || permission.canEdit || permission.canUpload) {
    return null;
  }

  return SimpleErrorHandler.handleApiError(
    request,
    createForbiddenError(`Forbidden: ${permission.reason}`)
  );
}
