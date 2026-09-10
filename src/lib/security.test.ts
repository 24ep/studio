import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { sanitizeUrl, validateRequest } from './security';

describe('sanitizeUrl', () => {
  it('allows common safe URLs and relative paths', () => {
    expect(sanitizeUrl('https://example.com/file.pdf')).toBe('https://example.com/file.pdf');
    expect(sanitizeUrl('/api/secure-file/preview?filePath=a.pdf')).toBe('/api/secure-file/preview?filePath=a.pdf');
    expect(sanitizeUrl('mailto:hr@example.com')).toBe('mailto:hr@example.com');
  });

  it('blocks executable or ambiguous URLs', () => {
    expect(sanitizeUrl('javascript:alert(1)')).toBe('');
    expect(sanitizeUrl('vbscript:msgbox(1)')).toBe('');
    expect(sanitizeUrl('example.com/no-protocol')).toBe('');
  });
});

describe('validateRequest', () => {
  it('accepts standard reverse-proxy forwarding headers', () => {
    const request = new NextRequest('https://app.example.com/api/security/dashboard?limit=50', {
      headers: {
        'user-agent': 'Mozilla/5.0',
        'x-forwarded-host': 'app.example.com',
        'x-forwarded-for': '203.0.113.10',
      },
    });

    expect(validateRequest(request)).toEqual({ valid: true, errors: [] });
  });

  it('still rejects requests without a User-Agent', () => {
    const request = new NextRequest('https://app.example.com/api/security/dashboard?limit=50');

    expect(validateRequest(request)).toEqual({
      valid: false,
      errors: ['Invalid or missing User-Agent'],
    });
  });
});
