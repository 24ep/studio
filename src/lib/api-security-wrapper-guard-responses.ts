import { NextResponse } from 'next/server';

import type { ApiSecurityGuardResult } from './api-security-guard-types';

function guardFailure(body: Record<string, unknown>, status: number): ApiSecurityGuardResult {
  return {
    ok: false,
    response: NextResponse.json(body, { status }),
  };
}

export function methodNotAllowedResponse() {
  return guardFailure({ error: 'Method not allowed' }, 405);
}

export function invalidRequestResponse(errors: string[]) {
  return guardFailure({ error: 'Invalid request', details: errors }, 400);
}

export function unauthorizedResponse() {
  return guardFailure(
    { error: 'Unauthorized', message: 'Authentication required' },
    401,
  );
}

export function invalidSessionResponse() {
  return guardFailure(
    { error: 'Invalid session', message: 'Please sign in again' },
    401,
  );
}

export function forbiddenResponse(message: string) {
  return guardFailure({ error: 'Forbidden', message }, 403);
}

export function csrfFailureResponse() {
  return guardFailure({ error: 'CSRF token validation failed' }, 403);
}

export function invalidRequestBodyResponse() {
  return guardFailure({ error: 'Invalid request body' }, 400);
}
