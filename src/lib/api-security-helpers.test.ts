import { describe, expect, it } from 'vitest';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import {
  addSecurityHeaders,
  getClientIP,
  sanitizeApiResponse,
} from './api-security-helpers';

function requestWithHeaders(headers: Record<string, string>) {
  return {
    headers: {
      get: (name: string) => headers[name.toLowerCase()] ?? null,
    },
  } as unknown as NextRequest;
}

describe('api-security-helpers', () => {
  it('resolves client IP from trusted proxy headers before legacy connection data', () => {
    expect(getClientIP(requestWithHeaders({ 'cf-connecting-ip': '203.0.113.1' }))).toBe('203.0.113.1');
    expect(getClientIP(requestWithHeaders({ 'x-real-ip': '203.0.113.2' }))).toBe('203.0.113.2');
    expect(getClientIP(requestWithHeaders({ 'x-forwarded-for': '203.0.113.3, 10.0.0.1' }))).toBe('203.0.113.3');

    const legacyRequest = {
      headers: { get: () => null },
      connection: { remoteAddress: '203.0.113.4' },
    } as unknown as NextRequest;
    expect(getClientIP(legacyRequest)).toBe('203.0.113.4');
    expect(getClientIP(requestWithHeaders({}))).toBe('unknown');
  });

  it('recursively sanitizes response strings and redacts sensitive fields', () => {
    expect(sanitizeApiResponse({
      name: '<Ana>',
      accessToken: 'secret',
      nested: {
        passwordHash: 'hash',
        values: ['<ok>', { safe: '<yes>' }],
      },
    })).toEqual({
      name: 'Ana',
      accessToken: '[REDACTED]',
      nested: {
        passwordHash: '[REDACTED]',
        values: ['ok', { safe: 'yes' }],
      },
    });
  });

  it('adds standard security headers to responses', () => {
    const response = addSecurityHeaders(NextResponse.json({ ok: true }));

    expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(response.headers.get('X-Frame-Options')).toBe('DENY');
    expect(response.headers.get('X-XSS-Protection')).toBe('1; mode=block');
    expect(response.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
    expect(response.headers.get('Permissions-Policy')).toContain('camera=()');
  });
});
