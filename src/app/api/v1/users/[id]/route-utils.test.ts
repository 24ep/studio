import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/auth', () => ({
  verifyApiToken: vi.fn(),
}));

import {
  buildUserUpdateQuery,
  formatZodFieldErrors,
  toAuditPayload,
  updateUserSchema,
} from './route-utils';

describe('user detail route utils', () => {
  it('builds an update query for supplied fields only', () => {
    const query = buildUserUpdateQuery({ name: 'Ada', role: 'Admin' }, 'user-1');

    expect(query).not.toBeNull();
    expect(query?.text).toContain('name = $1');
    expect(query?.text).toContain('role = $2');
    expect(query?.text).toContain('WHERE id = $3');
    expect(query?.values).toEqual(['Ada', 'Admin', 'user-1']);
  });

  it('does not build an empty update query', () => {
    expect(buildUserUpdateQuery({}, 'user-1')).toBeNull();
  });

  it('formats zod field errors', () => {
    const result = updateUserSchema.safeParse({ email: 'bad' });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(formatZodFieldErrors(result.error)).toContain('email: Invalid email');
    }
  });

  it('normalizes audit payloads', () => {
    expect(toAuditPayload({ email: 'ada@example.com' })).toEqual({ email: 'ada@example.com' });
    expect(toAuditPayload('raw')).toEqual({ requestBody: 'raw' });
    expect(toAuditPayload(undefined)).toEqual({});
  });
});
