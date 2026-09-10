import { type NextRequest } from 'next/server';
import { verifyApiToken } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import {
  SimpleErrorHandler,
  createForbiddenError,
  createUnauthorizedError,
} from '@/lib/errors';

export async function requireV1ApplicantsUser(request: NextRequest, permission?: string) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.split(' ')[1];
  const user = token ? await verifyApiToken(token) : null;

  if (!user) {
    return {
      ok: false as const,
      response: SimpleErrorHandler.handleApiError(request, createUnauthorizedError('Authentication required')),
    };
  }

  if (permission && !hasPermission(user, permission)) {
    return {
      ok: false as const,
      response: SimpleErrorHandler.handleApiError(request, createForbiddenError('Insufficient permissions to create Applicants')),
    };
  }

  return { ok: true as const, user };
}
