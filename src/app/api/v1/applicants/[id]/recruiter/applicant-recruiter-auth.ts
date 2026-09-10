import { type NextRequest } from 'next/server';
import { verifyApiToken } from '@/lib/auth';
import { canAssignRecruiter } from '@/lib/permissions';
import { permissionMatches } from '@/lib/permission-aliases';
import {
  createForbiddenError,
  createUnauthorizedError,
  SimpleErrorHandler,
} from '@/lib/errors';

export type ApplicantRecruiterApiUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  role?: string;
  modulePermissions?: string[];
};

export async function authenticateApplicantRecruiterRequest(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.split(' ')[1];
  return token ? await verifyApiToken(token) : null;
}

export function requireApplicantRecruiterUser(req: NextRequest, user: ApplicantRecruiterApiUser | null) {
  if (!user) {
    return SimpleErrorHandler.handleApiError(req, createUnauthorizedError('Authentication required'));
  }

  return null;
}

export function requireApplicantRecruiterUpdatePermission(req: NextRequest, user: ApplicantRecruiterApiUser | null) {
  const unauthorized = requireApplicantRecruiterUser(req, user);
  if (unauthorized || !user) {
    return unauthorized;
  }

  if (
    user.role !== 'Admin'
    && !permissionMatches(user.modulePermissions, 'APPLICANTS_RECRUITER_ASSIGN')
    && !permissionMatches(user.modulePermissions, 'APPLICANTS_RECRUITER_ASSIGN_OWN')
  ) {
    return SimpleErrorHandler.handleApiError(
      req,
      createForbiddenError('Insufficient permissions to update Applicant recruiter')
    );
  }

  return null;
}

export function requireApplicantRecruiterDeletePermission(req: NextRequest, user: ApplicantRecruiterApiUser | null) {
  if (!user || (user.role !== 'Admin' && !permissionMatches(user.modulePermissions, 'APPLICANTS_RECRUITER_ASSIGN'))) {
    return SimpleErrorHandler.handleApiError(
      req,
      createForbiddenError('Insufficient permissions to unassign Applicant recruiter')
    );
  }

  return null;
}

export function requireApplicantRecruiterOwnershipPermission(
  req: NextRequest,
  user: ApplicantRecruiterApiUser,
  applicantRecruiterId: string | null
) {
  if (user.role === 'Admin' || permissionMatches(user.modulePermissions, 'APPLICANTS_RECRUITER_ASSIGN')) {
    return null;
  }

  const recruiterPermission = canAssignRecruiter(user, applicantRecruiterId, user.id);
  return recruiterPermission.canAssign
    ? null
    : SimpleErrorHandler.handleApiError(req, createForbiddenError(`Forbidden: ${recruiterPermission.reason}`));
}

export function getApplicantRecruiterActingUserName(user: ApplicantRecruiterApiUser) {
  return (user.name || user.email || user.id || 'System') as string;
}
