import { type NextRequest } from 'next/server';
import { verifyApiToken } from '@/lib/auth';
import { SimpleErrorHandler, createForbiddenError, createUnauthorizedError } from '@/lib/errors';

export async function requireV1SettingsAdmin(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.split(' ')[1];
  const user = token ? await verifyApiToken(token) : null;

  if (!user) {
    return {
      ok: false as const,
      response: SimpleErrorHandler.handleApiError(request, createUnauthorizedError('Authentication required')),
    };
  }

  if (user.role !== 'Admin') {
    return {
      ok: false as const,
      response: SimpleErrorHandler.handleApiError(request, createForbiddenError('Admin role required to access settings')),
    };
  }

  return { ok: true as const, user };
}
