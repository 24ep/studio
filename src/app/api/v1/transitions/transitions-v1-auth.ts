import { type NextRequest } from 'next/server';
import { verifyApiToken } from '@/lib/auth';
import { createUnauthorizedError, SimpleErrorHandler } from '@/lib/errors';

export async function requireV1TransitionUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.split(' ')[1];
  const user = token ? await verifyApiToken(token) : null;

  if (!user) {
    return {
      ok: false as const,
      response: SimpleErrorHandler.handleApiError(request, createUnauthorizedError('Authentication required')),
    };
  }

  return {
    ok: true as const,
    user,
  };
}
