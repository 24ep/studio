import type { NextRequest } from 'next/server';

import {
  apiRateLimiter,
  authRateLimiter,
  searchRateLimiter,
  uploadRateLimiter,
} from './lib/rateLimiter';

const SKIPPED_PATH_PREFIXES = [
  '/_next',
  '/apply',
  '/offer',
  '/employee-portal/public',
  '/setup',
  '/auth/setup-password',
  '/api/auth',
  '/api/public',
  '/api-docs',
  '/api/manifest.json',
  '/sw.js',
  '/favicon.ico',
];

const SESSION_COOKIE_NAMES = [
  'next-auth.session-token',
  '__Secure-next-auth.session-token',
  'authjs.session-token',
  '__Secure-authjs.session-token',
];

export const SECURITY_HEADERS = {
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'X-XSS-Protection': '1; mode=block',
} as const;

export function shouldSkipMiddlewarePath(pathname: string) {
  return SKIPPED_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix)) || pathname.includes('.');
}

export function isApiPath(pathname: string) {
  return pathname.startsWith('/api/');
}

export function isTokenizedEvaluationPath(request: NextRequest) {
  return request.nextUrl.pathname.includes('/applicants/')
    && request.nextUrl.pathname.includes('/evaluate')
    && Boolean(request.nextUrl.searchParams.get('token'));
}

export function isSignInPath(pathname: string) {
  return pathname.startsWith('/auth/signin');
}

export function hasNextAuthSessionToken(request: NextRequest) {
  return request.cookies.getAll().some((cookie) =>
    SESSION_COOKIE_NAMES.some((name) => cookie.name === name || cookie.name.startsWith(`${name}.`))
  );
}

export function canUsePathnameAsCallback(pathname: string) {
  return pathname.startsWith('/') && !pathname.startsWith('//') && pathname !== '/auth/signin';
}

export function selectRateLimiter(pathname: string) {
  if (pathname.includes('/auth/') || pathname.includes('/signin')) {
    return authRateLimiter;
  }

  if (pathname.includes('/upload') || pathname.includes('/file')) {
    return uploadRateLimiter;
  }

  if (pathname.includes('/search') || pathname.includes('/applicants')) {
    return searchRateLimiter;
  }

  return apiRateLimiter;
}

export function buildRateLimitHeaders({
  remaining,
  resetTime,
}: {
  remaining: number;
  resetTime: number;
}) {
  return {
    'X-RateLimit-Limit': '100',
    'X-RateLimit-Remaining': remaining.toString(),
    'X-RateLimit-Reset': new Date(resetTime).toISOString(),
  };
}

export function buildRateLimitExceededBody(resetTime: number, now = Date.now()) {
  return {
    error: 'Too many requests',
    message: 'Rate limit exceeded. Please try again later.',
    retryAfter: Math.ceil((resetTime - now) / 1000),
  };
}
