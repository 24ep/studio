import { NextRequest } from 'next/server';

import type {
  ApiSecurityGuardResult,
} from '@/lib/api-security-guard-types';
import { unauthorizedResponse } from '@/lib/api-security-wrapper-guard-responses';
import type { ResolvedApiSecurityOptions } from '@/lib/api-security-wrapper-utils';
import {
  requireApiSession,
  sanitizeApiRequestBody,
  validateApiMethod,
  validateApiPermission,
  validateApiRequest,
  validateApiSession,
} from '@/lib/api-security-wrapper-primary-guards';
import {
  logApiAccessIfNeeded,
  validateApiCsrf,
} from '@/lib/api-security-wrapper-request-finalizers';

export async function runApiSecurityGuards(
  req: NextRequest,
  securityOptions: ResolvedApiSecurityOptions,
): Promise<ApiSecurityGuardResult> {
  const methodValidation = validateApiMethod(req, securityOptions);
  if (!methodValidation.ok) return methodValidation;

  const requestValidation = await validateApiRequest(req);
  if (!requestValidation.ok) return requestValidation;

  if (!securityOptions.requireAuth) {
    return { ok: true };
  }

  const sessionResult = await requireApiSession();
  if (!sessionResult.ok) return sessionResult;
  const { session } = sessionResult;
  if (!session) {
    return unauthorizedResponse();
  }

  const sessionValidation = await validateApiSession(session);
  if (!sessionValidation.ok) return sessionValidation;

  const permissionValidation = await validateApiPermission(session, securityOptions.requirePermission);
  if (!permissionValidation.ok) return permissionValidation;

  const csrfValidation = await validateApiCsrf(req, session);
  if (!csrfValidation.ok) return csrfValidation;

  const bodySanitization = await sanitizeApiRequestBody(req, securityOptions);
  if (!bodySanitization.ok) return bodySanitization;

  await logApiAccessIfNeeded(req, session, securityOptions);
  return { ok: true, session };
}
