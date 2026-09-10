import { describe, expect, it } from 'vitest';

import {
  getSystemApiKeyErrorMessage,
  getSystemApiKeyInvalidReason,
} from './system-api-key-validation';
import type { ApiKeyData } from './system-api-key-types';

function apiKeyData(input: Partial<ApiKeyData> = {}): ApiKeyData {
  return {
    id: 'key-1',
    name: 'Integration key',
    description: null,
    keyPrefix: 'sk_test_1234',
    isActive: true,
    expiresAt: null,
    lastUsedAt: null,
    lastUsedIp: null,
    usageCount: 0,
    createdById: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...input,
  };
}

describe('system-api-key-validation', () => {
  it('detects inactive and expired keys', () => {
    expect(getSystemApiKeyInvalidReason(apiKeyData())).toBeNull();
    expect(getSystemApiKeyInvalidReason(apiKeyData({ isActive: false }))).toBe('API key is disabled');
    expect(getSystemApiKeyInvalidReason(apiKeyData({
      expiresAt: new Date('2020-01-01T00:00:00.000Z'),
    }))).toBe('API key has expired');
  });

  it('normalizes unknown errors for audit logging', () => {
    expect(getSystemApiKeyErrorMessage(new Error('boom'))).toBe('boom');
    expect(getSystemApiKeyErrorMessage('bad')).toBe('bad');
  });
});
