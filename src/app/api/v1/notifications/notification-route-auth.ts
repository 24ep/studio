import type { NextRequest } from 'next/server';
import { verifyApiToken } from '@/lib/auth';
import {
  createForbiddenError,
  createUnauthorizedError,
  SimpleErrorHandler,
} from '@/lib/errors';
import type { VerifiedApiToken } from '@/lib/auth';

export async function requireNotificationApiUser(request: NextRequest): Promise<
  | { ok: true; user: VerifiedApiToken }
  | { ok: false; response: Response }
> {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.split(' ')[1];
  const user = token ? await verifyApiToken(token) : null;

  if (!user) {
    return {
      ok: false,
      response: SimpleErrorHandler.handleApiError(request, createUnauthorizedError('Authentication required')),
    };
  }

  return { ok: true, user };
}

export function requireNotificationSendPermission(request: NextRequest, user: VerifiedApiToken) {
  if (user.role === 'Admin' || user.modulePermissions?.includes('applicantS_EDIT_BASIC')) {
    return null;
  }

  return SimpleErrorHandler.handleApiError(
    request,
    createForbiddenError('Insufficient permissions to send notifications')
  );
}
