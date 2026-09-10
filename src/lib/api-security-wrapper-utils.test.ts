import { describe, expect, it } from 'vitest';
import type { NextRequest } from 'next/server';
import {
  getInsufficientPermissionMessage,
  hasRequiredApiPermission,
  isStateChangingMethod,
  resolveApiSecurityOptions,
  shouldValidateApiInput,
} from './api-security-wrapper-utils';

describe('api-security-wrapper-utils', () => {
  it('resolves security options with defaults', () => {
    expect(resolveApiSecurityOptions()).toMatchObject({
      requireAuth: true,
      rateLimit: true,
      validateInput: true,
      logAccess: true,
      allowedMethods: ['GET', 'POST', 'PUT', 'DELETE'],
    });

    expect(resolveApiSecurityOptions({ requireAuth: false, allowedMethods: ['GET'] })).toMatchObject({
      requireAuth: false,
      allowedMethods: ['GET'],
    });
  });

  it('classifies methods for csrf and input validation', () => {
    expect(isStateChangingMethod('POST')).toBe(true);
    expect(isStateChangingMethod('GET')).toBe(false);
    expect(shouldValidateApiInput('PUT', true)).toBe(true);
    expect(shouldValidateApiInput('DELETE', true)).toBe(false);
    expect(shouldValidateApiInput('POST', false)).toBe(false);
  });

  it('checks required permissions and user-facing permission messages', () => {
    expect(hasRequiredApiPermission({ role: 'Admin', modulePermissions: [] }, 'USERS_EDIT')).toBe(true);
    expect(hasRequiredApiPermission({ role: 'Recruiter', modulePermissions: ['USERS_EDIT'] }, 'USERS_EDIT')).toBe(true);
    expect(hasRequiredApiPermission({ role: 'Recruiter', modulePermissions: [] }, 'USERS_EDIT')).toBe(false);
    expect(hasRequiredApiPermission(null, undefined)).toBe(true);
    expect(getInsufficientPermissionMessage('USERS_EDIT')).toBe('Insufficient permissions to users edit');
  });
});
