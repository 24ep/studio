import { type NextRequest } from 'next/server';
import { verifyApiToken } from '@/lib/auth';
import { SimpleErrorHandler, createUnauthorizedError } from '@/lib/errors';

export async function requireDashboardV1Auth(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.split(' ')[1];
  const user = token ? await verifyApiToken(token) : null;

  if (!user) {
    return SimpleErrorHandler.handleApiError(request, createUnauthorizedError('Authentication required'));
  }

  return null;
}
