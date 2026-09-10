import { NextRequest } from 'next/server';

import { auth } from '@/auth';
import {
  sanitizeApiInput,
  validateRequest,
  validateSessionSecurity,
} from '@/lib/security';
import {
  logApiSecurityAudit,
  serviceUnavailableDuringBuild,
} from '@/lib/api-security-guard-audit';
import type {
  ApiSecurityGuardResult,
  ApiSecuritySession,
} from '@/lib/api-security-guard-types';
import { getClientIP } from '@/lib/api-security-helpers';
import {
  forbiddenResponse,
  invalidRequestBodyResponse,
  invalidRequestResponse,
  invalidSessionResponse,
  methodNotAllowedResponse,
  unauthorizedResponse,
} from '@/lib/api-security-wrapper-guard-responses';
import {
  getInsufficientPermissionMessage,
  hasRequiredApiPermission,
  shouldValidateApiInput,
  type ResolvedApiSecurityOptions,
} from '@/lib/api-security-wrapper-utils';
import { readRequestJsonResult } from '@/lib/request-json';

export function validateApiMethod(
  req: NextRequest,
  securityOptions: ResolvedApiSecurityOptions,
): ApiSecurityGuardResult {
  if (securityOptions.allowedMethods.includes(req.method)) {
    return { ok: true };
  }

  return methodNotAllowedResponse();
}

export async function validateApiRequest(req: NextRequest): Promise<ApiSecurityGuardResult> {
  let requestValidation;
  try {
    requestValidation = validateRequest(req);
  } catch (error) {
    console.warn('[API SECURITY] Request validation failed during build:', error);
    return { ok: false, response: serviceUnavailableDuringBuild() };
  }

  if (requestValidation.valid) {
    return { ok: true };
  }

  await logApiSecurityAudit(
    'WARN',
    `Security violation detected: ${requestValidation.errors.join(', ')}`,
    'API:Security',
    null,
    {
      ip: getClientIP(req),
      userAgent: req.headers.get('user-agent'),
      url: req.url,
      errors: requestValidation.errors,
    },
  );

  return invalidRequestResponse(requestValidation.errors);
}

export async function requireApiSession(): Promise<ApiSecurityGuardResult> {
  let session: ApiSecuritySession | null;
  try {
    session = await auth() as ApiSecuritySession | null;
  } catch (error) {
    console.warn('[API SECURITY] Session check failed during build:', error);
    return { ok: false, response: serviceUnavailableDuringBuild() };
  }

  if (!session) {
    return unauthorizedResponse();
  }

  return { ok: true, session };
}

export async function validateApiSession(session: ApiSecuritySession): Promise<ApiSecurityGuardResult> {
  let sessionValidation;
  try {
    sessionValidation = validateSessionSecurity(session);
  } catch (error) {
    console.warn('[API SECURITY] Session validation failed during build:', error);
    return { ok: false, response: serviceUnavailableDuringBuild() };
  }

  if (sessionValidation.valid) {
    return { ok: true, session };
  }

  await logApiSecurityAudit(
    'WARN',
    `Invalid session detected: ${sessionValidation.errors.join(', ')}`,
    'API:Session',
    session.user?.id,
    { errors: sessionValidation.errors },
  );

  return invalidSessionResponse();
}

export async function validateApiPermission(
  session: ApiSecuritySession,
  requirePermission?: string,
): Promise<ApiSecurityGuardResult> {
  if (!requirePermission || hasRequiredApiPermission(session.user, requirePermission)) {
    return { ok: true, session };
  }

  await logApiSecurityAudit(
    'WARN',
    `Insufficient permissions for ${requirePermission}`,
    'API:Permission',
    session.user.id,
    {
      requiredPermission: requirePermission,
      userPermissions: session.user.modulePermissions,
    },
  );

  return forbiddenResponse(getInsufficientPermissionMessage(requirePermission));
}

export function sanitizeApiRequestBody(
  req: NextRequest,
  securityOptions: ResolvedApiSecurityOptions,
): Promise<ApiSecurityGuardResult> {
  if (!shouldValidateApiInput(req.method, securityOptions.validateInput)) {
    return Promise.resolve({ ok: true });
  }

  return readRequestJsonResult(req).then((result) => {
    if (!result.ok) {
      return invalidRequestBodyResponse();
    }

    const sanitizedBody = sanitizeApiInput(result.value);
    req.json = () => Promise.resolve(sanitizedBody);
    return { ok: true } as ApiSecurityGuardResult;
  });
}
