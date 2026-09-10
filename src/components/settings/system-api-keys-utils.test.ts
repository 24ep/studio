import { describe, expect, it } from 'vitest';

import {
  buildSystemApiKeyCreatePayload,
  calculateSystemApiKeyExpirationDate,
  formatSystemApiKeyDate,
  isSystemApiKeyExpired,
} from './system-api-keys-utils';

describe('system API key utilities', () => {
  it('calculates expiration dates from preset options', () => {
    const now = new Date('2026-01-01T00:00:00.000Z');

    expect(calculateSystemApiKeyExpirationDate({ expiration: 'never', now })).toBeNull();
    expect(calculateSystemApiKeyExpirationDate({ expiration: '30days', now })?.toISOString()).toBe('2026-01-31T00:00:00.000Z');
    expect(calculateSystemApiKeyExpirationDate({ expiration: '90days', now })?.toISOString()).toBe('2026-04-01T00:00:00.000Z');
    expect(calculateSystemApiKeyExpirationDate({ expiration: '1year', now })?.toISOString()).toBe('2027-01-01T00:00:00.000Z');
  });

  it('builds trimmed create payloads', () => {
    expect(buildSystemApiKeyCreatePayload({
      name: '  n8n  ',
      description: '  Workflow key  ',
      expiration: 'custom',
      customExpiration: '2026-06-01T10:00:00.000Z',
    })).toEqual({
      name: 'n8n',
      description: 'Workflow key',
      expiresAt: '2026-06-01T10:00:00.000Z',
    });

    expect(buildSystemApiKeyCreatePayload({
      name: 'Zapier',
      description: '   ',
      expiration: 'never',
    })).toMatchObject({
      description: null,
      expiresAt: null,
    });
  });

  it('formats dates and detects expiration', () => {
    expect(formatSystemApiKeyDate(null)).toBe('Never');
    expect(formatSystemApiKeyDate('2026-01-01T12:30:00.000Z')).toContain('2026');
    expect(isSystemApiKeyExpired({ expiresAt: '2025-01-01T00:00:00.000Z' }, new Date('2026-01-01T00:00:00.000Z'))).toBe(true);
    expect(isSystemApiKeyExpired({ expiresAt: null }, new Date('2026-01-01T00:00:00.000Z'))).toBe(false);
  });
});
