import { describe, expect, it } from 'vitest';

import {
  apiRateLimiter,
  authRateLimiter,
  searchRateLimiter,
  uploadRateLimiter,
} from './lib/rateLimiter';
import {
  buildRateLimitExceededBody,
  buildRateLimitHeaders,
  canUsePathnameAsCallback,
  hasNextAuthSessionToken,
  isApiPath,
  isSignInPath,
  isTokenizedEvaluationPath,
  selectRateLimiter,
  shouldSkipMiddlewarePath,
} from './middleware-utils';

function makeRequest(url: string, cookieNames: string[] = []) {
  return {
    cookies: {
      getAll: () => cookieNames.map((name) => ({ name, value: 'token' })),
    },
    nextUrl: new URL(url),
  };
}

describe('middleware utilities', () => {
  it('classifies skipped middleware paths', () => {
    expect(shouldSkipMiddlewarePath('/_next/static/app.js')).toBe(true);
    expect(shouldSkipMiddlewarePath('/api/auth/session')).toBe(true);
    expect(shouldSkipMiddlewarePath('/auth/setup-password')).toBe(true);
    expect(shouldSkipMiddlewarePath('/setup')).toBe(true);
    expect(shouldSkipMiddlewarePath('/favicon.ico')).toBe(true);
    expect(shouldSkipMiddlewarePath('/dashboard')).toBe(false);
  });

  it('detects API, sign-in, and tokenized evaluation paths', () => {
    expect(isApiPath('/api/protected')).toBe(true);
    expect(isApiPath('/dashboard')).toBe(false);
    expect(isSignInPath('/auth/signin')).toBe(true);
    expect(isTokenizedEvaluationPath(makeRequest('https://app.test/applicants/1/evaluate?token=abc') as never)).toBe(true);
    expect(isTokenizedEvaluationPath(makeRequest('https://app.test/applicants/1/evaluate') as never)).toBe(false);
  });

  it('detects NextAuth and Auth.js session cookie variants', () => {
    expect(hasNextAuthSessionToken(makeRequest('https://app.test', ['next-auth.session-token']) as never)).toBe(true);
    expect(hasNextAuthSessionToken(makeRequest('https://app.test', ['__Secure-authjs.session-token.0']) as never)).toBe(true);
    expect(hasNextAuthSessionToken(makeRequest('https://app.test', ['unrelated']) as never)).toBe(false);
  });

  it('validates callback path safety', () => {
    expect(canUsePathnameAsCallback('/dashboard')).toBe(true);
    expect(canUsePathnameAsCallback('//evil.test')).toBe(false);
    expect(canUsePathnameAsCallback('/auth/signin')).toBe(false);
  });

  it('selects rate limiters by route class', () => {
    expect(selectRateLimiter('/api/auth/login')).toBe(authRateLimiter);
    expect(selectRateLimiter('/api/upload-image')).toBe(uploadRateLimiter);
    expect(selectRateLimiter('/api/applicants')).toBe(searchRateLimiter);
    expect(selectRateLimiter('/api/settings')).toBe(apiRateLimiter);
  });

  it('builds stable rate-limit headers and body', () => {
    expect(buildRateLimitHeaders({
      remaining: 7,
      resetTime: Date.UTC(2026, 0, 1),
    })).toEqual({
      'X-RateLimit-Limit': '100',
      'X-RateLimit-Remaining': '7',
      'X-RateLimit-Reset': '2026-01-01T00:00:00.000Z',
    });
    expect(buildRateLimitExceededBody(Date.UTC(2026, 0, 1, 0, 1), Date.UTC(2026, 0, 1))).toMatchObject({
      error: 'Too many requests',
      retryAfter: 60,
    });
  });
});
