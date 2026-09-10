import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/auth', () => ({
  verifyApiToken: vi.fn(),
}));

import {
  buildPositionUpdateQuery,
  formatZodFieldErrors,
  serializePositionRow,
  toAuditPayload,
  updatePositionSchema,
} from './route-utils';

describe('position detail route utils', () => {
  it('builds an update query from only the supplied fields', () => {
    const query = buildPositionUpdateQuery(
      {
        title: 'Senior Engineer',
        isOpen: false,
        custom_attributes: { team: 'Platform' },
      },
      'position-1'
    );

    expect(query).not.toBeNull();
    expect(query?.text).toContain('title = $1');
    expect(query?.text).toContain('"isOpen" = $2');
    expect(query?.text).toContain('"customAttributes" = $3');
    expect(query?.text).toContain('"updatedAt" = NOW()');
    expect(query?.text).toContain('WHERE id = $4');
    expect(query?.values).toEqual(['Senior Engineer', false, { team: 'Platform' }, 'position-1']);
  });

  it('does not build an update query when no editable fields are present', () => {
    expect(buildPositionUpdateQuery({}, 'position-1')).toBeNull();
  });

  it('formats validation errors for route responses', () => {
    const result = updatePositionSchema.safeParse({ title: '' });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(formatZodFieldErrors(result.error)).toBe('title: String must contain at least 1 character(s)');
    }
  });

  it('serializes response rows with custom attributes and recruiter data', () => {
    expect(
      serializePositionRow({
        id: 'position-1',
        recruiterId: 'user-1',
        recruiterName: 'Ada',
        recruiterEmail: 'ada@example.com',
        customAttributes: null,
      })
    ).toMatchObject({
      custom_attributes: {},
      recruiter: {
        id: 'user-1',
        name: 'Ada',
        email: 'ada@example.com',
      },
    });
  });

  it('normalizes non-object request bodies for audit payloads', () => {
    expect(toAuditPayload('raw body')).toEqual({ requestBody: 'raw body' });
    expect(toAuditPayload(undefined)).toEqual({});
    expect(toAuditPayload({ title: 'Role' })).toEqual({ title: 'Role' });
  });
});
