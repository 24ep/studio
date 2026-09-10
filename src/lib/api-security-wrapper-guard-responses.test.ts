import { describe, expect, it } from 'vitest';

import {
  csrfFailureResponse,
  forbiddenResponse,
  invalidRequestBodyResponse,
  invalidRequestResponse,
  invalidSessionResponse,
  methodNotAllowedResponse,
  unauthorizedResponse,
} from './api-security-wrapper-guard-responses';
import type { ApiSecurityGuardResult } from './api-security-guard-types';

async function readFailure(result: ApiSecurityGuardResult) {
  if (result.ok) {
    throw new Error('Expected a guard failure response');
  }

  return {
    status: result.response.status,
    body: await result.response.json(),
  };
}

describe('api security guard response factories', () => {
  it('builds common authentication and permission failures', async () => {
    await expect(readFailure(unauthorizedResponse())).resolves.toEqual({
      status: 401,
      body: { error: 'Unauthorized', message: 'Authentication required' },
    });
    await expect(readFailure(invalidSessionResponse())).resolves.toEqual({
      status: 401,
      body: { error: 'Invalid session', message: 'Please sign in again' },
    });
    await expect(readFailure(forbiddenResponse('Missing permission'))).resolves.toEqual({
      status: 403,
      body: { error: 'Forbidden', message: 'Missing permission' },
    });
  });

  it('builds request validation failures', async () => {
    await expect(readFailure(methodNotAllowedResponse())).resolves.toEqual({
      status: 405,
      body: { error: 'Method not allowed' },
    });
    await expect(readFailure(invalidRequestResponse(['bad header']))).resolves.toEqual({
      status: 400,
      body: { error: 'Invalid request', details: ['bad header'] },
    });
    await expect(readFailure(invalidRequestBodyResponse())).resolves.toEqual({
      status: 400,
      body: { error: 'Invalid request body' },
    });
    await expect(readFailure(csrfFailureResponse())).resolves.toEqual({
      status: 403,
      body: { error: 'CSRF token validation failed' },
    });
  });
});
