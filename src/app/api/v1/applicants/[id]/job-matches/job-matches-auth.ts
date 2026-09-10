import { type NextRequest } from 'next/server';
import { verifyApiToken } from '@/lib/auth';
import { jsonCors } from './job-matches-response';

type JobMatchPermission = 'JOB_MATCH_VIEW' | 'JOB_MATCH_MANAGE';

const FORBIDDEN_MESSAGES: Record<JobMatchPermission, string> = {
  JOB_MATCH_VIEW: 'Forbidden: Insufficient permissions to view job matches',
  JOB_MATCH_MANAGE: 'Forbidden: Insufficient permissions to manage job matches',
};

export async function requireJobMatchPermission(request: NextRequest, permission: JobMatchPermission) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.split(' ')[1];
  const user = token ? await verifyApiToken(token) : null;

  if (!user) {
    return jsonCors(request, { error: 'Unauthorized' }, 401);
  }

  if (user.role !== 'Admin' && !user.modulePermissions?.includes(permission)) {
    return jsonCors(request, { error: FORBIDDEN_MESSAGES[permission] }, 403);
  }

  return null;
}
