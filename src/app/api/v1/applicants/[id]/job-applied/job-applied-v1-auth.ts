import { type NextRequest } from 'next/server';
import { verifyApiToken } from '@/lib/auth';
import { canEditApplicant } from '@/lib/permissions';
import { permissionMatches } from '@/lib/permission-aliases';
import { jsonResponse } from './job-applied-v1-response';

type JobAppliedV1User = {
  id: string;
  role?: string;
  modulePermissions?: string[];
};

export async function requireJobAppliedV1User(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.split(' ')[1];
  const user = token ? await verifyApiToken(token) as JobAppliedV1User | null : null;

  return user
    ? { ok: true as const, user }
    : { ok: false as const, response: jsonResponse(request, { error: 'Unauthorized' }, 401) };
}

export function getJobAppliedEditPermissions(user: JobAppliedV1User) {
  return {
    hasGlobalSensitiveEditPermission: permissionMatches(user.modulePermissions, 'APPLICANTS_EDIT_SENSITIVE'),
    hasOwnSensitiveEditPermission: permissionMatches(user.modulePermissions, 'APPLICANTS_EDIT_SENSITIVE_OWN'),
  };
}

export function validateInitialJobAppliedEditAccess(request: NextRequest, user: JobAppliedV1User) {
  const permissions = getJobAppliedEditPermissions(user);
  if (user.role !== 'Admin'
    && !permissions.hasGlobalSensitiveEditPermission
    && !permissions.hasOwnSensitiveEditPermission) {
    return {
      ok: false as const,
      response: jsonResponse(
        request,
        { error: 'Forbidden: Insufficient permissions to manage job_applied data' },
        403
      ),
    };
  }

  return { ok: true as const, permissions };
}

export function validateApplicantOwnershipAccess(
  request: NextRequest,
  user: JobAppliedV1User,
  recruiterId: string | null,
  hasGlobalSensitiveEditPermission: boolean
) {
  if (user.role === 'Admin' || hasGlobalSensitiveEditPermission) {
    return null;
  }

  const editPermission = canEditApplicant(user, recruiterId, user.id);
  return editPermission.canEdit
    ? null
    : jsonResponse(request, { error: `Forbidden: ${editPermission.reason}` }, 403);
}
