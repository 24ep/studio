import type { NextRequest } from 'next/server';
import { verifyApiToken, type VerifiedApiToken } from '@/lib/auth';
import { v1PositionBulkActionResponse } from './positions-v1-bulk-action-response';

export function getV1PositionBulkActionActingUserName(user: VerifiedApiToken): string {
  return String(user.name || user.email || user.id || 'System');
}

export async function requireV1PositionBulkActionUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.split(' ')[1];
  const user = token ? await verifyApiToken(token) : null;

  if (!user) {
    return {
      ok: false as const,
      response: v1PositionBulkActionResponse(request, { error: 'Unauthorized' }, 401),
    };
  }

  if (user.role !== 'Admin' && !user.modulePermissions?.includes('POSITIONS_EDIT_DETAILED')) {
    return {
      ok: false as const,
      response: v1PositionBulkActionResponse(request, { error: 'Forbidden: Insufficient permissions' }, 403),
    };
  }

  return { ok: true as const, user };
}
