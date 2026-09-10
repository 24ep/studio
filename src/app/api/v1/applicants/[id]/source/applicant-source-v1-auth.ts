import { type NextRequest } from 'next/server';
import { verifyApiToken } from '@/lib/auth';
import { SimpleErrorHandler, createForbiddenError, createUnauthorizedError } from '@/lib/errors';
import { permissionMatches } from '@/lib/permission-aliases';

export async function requireApplicantSourceView(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.split(' ')[1];
  const user = token ? await verifyApiToken(token) : null;

  if (!user) {
    return {
      ok: false as const,
      response: SimpleErrorHandler.handleApiError(request, createUnauthorizedError('Authentication required')),
    };
  }

  return { ok: true as const, user };
}

export async function requireApplicantSourceUpdate(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.split(' ')[1];
  const user = token ? await verifyApiToken(token) : null;

  if (!user || (user.role !== 'Admin' && !permissionMatches(user.modulePermissions, 'APPLICANTS_SOURCE_ASSIGN'))) {
    return {
      ok: false as const,
      response: SimpleErrorHandler.handleApiError(
        request,
        createForbiddenError('Insufficient permissions to update Applicant sources'),
      ),
    };
  }

  return { ok: true as const, user };
}
