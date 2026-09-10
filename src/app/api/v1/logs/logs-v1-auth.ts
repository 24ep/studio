import { type NextRequest } from 'next/server';
import { verifyApiToken } from '@/lib/auth';
import { SimpleErrorHandler, createForbiddenError, createUnauthorizedError } from '@/lib/errors';
import { hasPermission } from '@/lib/permissions';

export async function requireV1LogsViewPermission(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.split(' ')[1];
  const user = token ? await verifyApiToken(token) : null;

  if (!user) {
    return SimpleErrorHandler.handleApiError(request, createUnauthorizedError('Authentication required'));
  }

  if (!hasPermission(user, 'LOGS_VIEW')) {
    return SimpleErrorHandler.handleApiError(request, createForbiddenError('Insufficient permissions to view logs'));
  }

  return null;
}
