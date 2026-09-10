import { type NextRequest } from 'next/server';
import { verifyApiToken } from '@/lib/auth';
import { hasAnyPermission } from '@/lib/permissions';
import { v1BulkActionErrorResponse } from './applicants-v1-bulk-action-response';
import type { PlatformModuleId } from '@/lib/types';
import type { V1ApplicantsBulkAction, V1BulkActionUser } from './applicants-v1-bulk-action-types';

const REQUIRED_ACTION_PERMISSIONS: Record<V1ApplicantsBulkAction, PlatformModuleId[]> = {
  assign_recruiter: ['applicantS_RECRUITER_ASSIGN', 'applicantS_RECRUITER_ASSIGN_OWN'],
  assign_position: ['applicantS_EDIT_BASIC', 'applicantS_EDIT_BASIC_OWN'],
  update_status: ['applicantS_PIPELINE_STAGE_BULK_UPDATE', 'applicantS_PIPELINE_STAGE_UPDATE_OWN'],
  delete: ['applicantS_DELETE'],
};

export function getV1BulkActionActorName(user: V1BulkActionUser) {
  return user?.name || user?.email || user?.id || 'System';
}

export async function requireV1BulkActionUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.split(' ')[1];
  const user = token ? await verifyApiToken(token) as V1BulkActionUser | null : null;

  if (!user) {
    return {
      ok: false as const,
      response: v1BulkActionErrorResponse(request, 'Unauthorized', 401),
    };
  }

  return { ok: true as const, user };
}

export function requireV1BulkActionPermission(
  request: NextRequest,
  user: V1BulkActionUser,
  action: unknown
) {
  if (!isV1BulkAction(action)) {
    return {
      ok: false as const,
      response: v1BulkActionErrorResponse(request, 'Forbidden: Insufficient permissions to perform this bulk action', 403),
    };
  }

  if (hasAnyPermission(user, REQUIRED_ACTION_PERMISSIONS[action])) {
    return { ok: true as const };
  }

  return {
    ok: false as const,
    response: v1BulkActionErrorResponse(request, 'Forbidden: Insufficient permissions to perform this bulk action', 403),
  };
}

function isV1BulkAction(action: unknown): action is V1ApplicantsBulkAction {
  return action === 'delete'
    || action === 'update_status'
    || action === 'assign_recruiter'
    || action === 'assign_position';
}
