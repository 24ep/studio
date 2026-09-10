import { type NextRequest } from 'next/server';
import { verifyApiToken } from '@/lib/auth';
import { permissionMatches } from '@/lib/permission-aliases';
import {
  SimpleErrorHandler,
  createForbiddenError,
  createUnauthorizedError,
} from '@/lib/errors';

export async function requireV1ApplicantUser(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.split(' ')[1];
  const user = token ? await verifyApiToken(token) : null;

  if (!user) {
    return {
      ok: false as const,
      response: SimpleErrorHandler.handleApiError(req, createUnauthorizedError('Authentication required')),
    };
  }

  return { ok: true as const, user };
}

export async function requireV1ApplicantUpdateUser(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.split(' ')[1];
  const user = token ? await verifyApiToken(token) : null;
  const hasBasicEditPermission = permissionMatches(user?.modulePermissions, 'APPLICANTS_EDIT_BASIC') || permissionMatches(user?.modulePermissions, 'APPLICANTS_EDIT_BASIC_OWN');
  const hasSensitiveEditPermission = permissionMatches(user?.modulePermissions, 'APPLICANTS_EDIT_SENSITIVE') || permissionMatches(user?.modulePermissions, 'APPLICANTS_EDIT_SENSITIVE_OWN');
  const hasPipelineUpdatePermission = permissionMatches(user?.modulePermissions, 'APPLICANTS_PIPELINE_STAGE_UPDATE') || permissionMatches(user?.modulePermissions, 'APPLICANTS_PIPELINE_STAGE_UPDATE_OWN');

  if (!user || (user.role !== 'Admin' && !hasBasicEditPermission && !hasSensitiveEditPermission && !hasPipelineUpdatePermission)) {
    return {
      ok: false as const,
      response: SimpleErrorHandler.handleApiError(req, createForbiddenError('Insufficient permissions to update applicants')),
    };
  }

  return { ok: true as const, user };
}

export async function requireV1ApplicantDeleteUser(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.split(' ')[1];
  const user = token ? await verifyApiToken(token) : null;

  if (!user || (user.role !== 'Admin' && !permissionMatches(user.modulePermissions, 'APPLICANTS_DELETE'))) {
    return {
      ok: false as const,
      response: SimpleErrorHandler.handleApiError(req, createForbiddenError('Insufficient permissions to delete applicants')),
    };
  }

  return { ok: true as const, user };
}
