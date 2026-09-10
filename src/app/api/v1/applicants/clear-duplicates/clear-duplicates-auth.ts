import { type NextRequest } from 'next/server';
import { verifyApiToken } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import { clearDuplicatesErrorResponse } from './clear-duplicates-response';

export async function requireClearDuplicatesUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.split(' ')[1];
  const user = token ? await verifyApiToken(token) : null;

  if (!user) {
    return {
      ok: false as const,
      response: clearDuplicatesErrorResponse(request, 'Invalid API token', 401),
    };
  }

  if (!hasPermission(user, 'applicantS_DELETE')) {
    return {
      ok: false as const,
      response: clearDuplicatesErrorResponse(request, 'Insufficient permissions to manage Applicants', 403),
    };
  }

  return { ok: true as const, user };
}

export async function getAuditUserIdFromRequest(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.split(' ')[1];
    const user = token ? await verifyApiToken(token) : null;
    return user?.id || 'unknown';
  } catch (authError) {
    console.error('[Clear Duplicates] Error getting user ID for audit log:', authError);
    return 'unknown';
  }
}
