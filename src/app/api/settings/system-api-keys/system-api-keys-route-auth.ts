import type { NextRequest } from 'next/server';

import { auth } from '@/auth';
import {
  createForbiddenError,
  createUnauthorizedError,
  SimpleErrorHandler,
} from '@/lib/errors';

export async function requireSystemApiKeyAdmin(req: NextRequest): Promise<
  | { ok: true; userId?: string }
  | { ok: false; response: Response }
> {
  const session = await auth();

  if (!session?.user) {
    return {
      ok: false,
      response: SimpleErrorHandler.handleApiError(
        req,
        createUnauthorizedError('Authentication required'),
      ),
    };
  }

  if (session.user.role !== 'Admin') {
    return {
      ok: false,
      response: SimpleErrorHandler.handleApiError(
        req,
        createForbiddenError('Admin access required to manage API keys'),
      ),
    };
  }

  return { ok: true, userId: session.user.id };
}
