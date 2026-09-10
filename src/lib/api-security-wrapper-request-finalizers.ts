import { NextRequest } from 'next/server';

import { validateCsrfToken } from '@/lib/security';
import {
  logApiSecurityAudit,
  serviceUnavailableDuringBuild,
} from '@/lib/api-security-guard-audit';
import type {
  ApiSecurityGuardResult,
  ApiSecuritySession,
} from '@/lib/api-security-guard-types';
import { getClientIP } from '@/lib/api-security-helpers';
import { csrfFailureResponse } from '@/lib/api-security-wrapper-guard-responses';
import {
  getApiRequestPath,
  getApiRequestQuery,
  isStateChangingMethod,
  type ResolvedApiSecurityOptions,
} from '@/lib/api-security-wrapper-utils';

export async function validateApiCsrf(
  req: NextRequest,
  session: ApiSecuritySession,
): Promise<ApiSecurityGuardResult> {
  if (!isStateChangingMethod(req.method)) {
    return { ok: true, session };
  }

  const csrfToken = req.headers.get('x-csrf-token');
  const sessionToken = req.cookies && typeof req.cookies.get === 'function'
    ? req.cookies.get('next-auth.csrf-token')?.value
    : undefined;

  let csrfValid;
  try {
    csrfValid = validateCsrfToken(csrfToken || '', sessionToken || '');
  } catch (error) {
    console.warn('[API SECURITY] CSRF validation failed during build:', error);
    return { ok: false, response: serviceUnavailableDuringBuild() };
  }

  if (csrfValid) {
    return { ok: true, session };
  }

  await logApiSecurityAudit(
    'WARN',
    'CSRF token validation failed',
    'API:CSRF',
    session.user.id,
    { method: req.method, url: req.url },
  );

  return csrfFailureResponse();
}

export async function logApiAccessIfNeeded(
  req: NextRequest,
  session: ApiSecuritySession,
  securityOptions: ResolvedApiSecurityOptions,
) {
  if (!securityOptions.logAccess) {
    return;
  }

  await logApiSecurityAudit(
    'AUDIT',
    `API access: ${req.method} ${getApiRequestPath(req)}`,
    'API:Access',
    session.user.id,
    {
      method: req.method,
      path: getApiRequestPath(req),
      query: getApiRequestQuery(req),
      userAgent: req.headers.get('user-agent'),
      ip: getClientIP(req),
    },
    '[API SECURITY] Access logging failed during build:',
  );
}
