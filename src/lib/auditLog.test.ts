import { describe, expect, it } from 'vitest';

import { auditContextFromRequest, canonicalizeAuditValue, computeAuditHash, sanitizeAuditValue } from './auditLog';

describe('audit integrity helpers', () => {
  it('canonicalizes objects independently of property insertion order', () => {
    const left = { z: 3, a: { second: true, first: 'value' }, list: [2, 1] };
    const right = { list: [2, 1], a: { first: 'value', second: true }, z: 3 };
    expect(canonicalizeAuditValue(left)).toBe(canonicalizeAuditValue(right));
    expect(computeAuditHash(left)).toBe(computeAuditHash(right));
  });

  it('changes the hash when evidence changes', () => {
    expect(computeAuditHash({ outcome: 'success' })).not.toBe(computeAuditHash({ outcome: 'failure' }));
  });

  it('extracts bounded trusted request context and rejects malformed addresses', () => {
    const request = new Request('https://example.test/api', {
      headers: {
        'x-request-id': 'request-123',
        'x-correlation-id': 'correlation-456',
        'x-forwarded-for': '203.0.113.8, 10.0.0.1',
        'user-agent': 'audit-test-agent',
        'x-company-id': '67de9d65-5b31-4fae-8bd8-b682557a83a6',
      },
    });
    expect(auditContextFromRequest(request)).toEqual({
      requestId: 'request-123', correlationId: 'correlation-456', ipAddress: '203.0.113.8',
      userAgent: 'audit-test-agent', companyId: null,
    });

    const malformed = new Request('https://example.test/api', { headers: { 'x-forwarded-for': 'not an address' } });
    expect(auditContextFromRequest(malformed).ipAddress).toBeNull();
  });

  it('redacts credentials and safely serializes hostile metadata', () => {
    const circular: Record<string, unknown> = { apiKey: 'top-secret', password: 'never-log-me', count: 12n };
    circular.self = circular;
    expect(sanitizeAuditValue(circular)).toEqual({ apiKey: '[REDACTED]', password: '[REDACTED]', count: '12', self: '[CIRCULAR]' });
  });
});
