import { NextRequest, NextResponse } from "next/server";
import { applyRateLimit } from '@/lib/rateLimiter';
import {
  buildRateLimitExceededBody,
  buildRateLimitHeaders,
  canUsePathnameAsCallback,
  hasNextAuthSessionToken,
  isApiPath,
  isSignInPath,
  isTokenizedEvaluationPath,
  SECURITY_HEADERS,
  selectRateLimiter,
  shouldSkipMiddlewarePath,
} from './middleware-utils';

export async function middleware(req: NextRequest) {
  try {
    // Fast dev: completely bypass middleware in development to speed up local loads
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.next();
    }

    const { pathname } = req.nextUrl;

    // Security headers for all responses
    const response = NextResponse.next();
    
    Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    // Skip middleware for static files and API routes that don't need session validation
    if (shouldSkipMiddlewarePath(pathname)) {
      return response;
    }

    // Apply rate limiting based on endpoint type
    if (isApiPath(pathname)) {
      const rateLimitResult = applyRateLimit(req, selectRateLimiter(pathname));
      
      // Add rate limit headers
      Object.entries(buildRateLimitHeaders(rateLimitResult)).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
      
      if (!rateLimitResult.allowed) {
        const body = buildRateLimitExceededBody(rateLimitResult.resetTime);
        return NextResponse.json(
          body, 
          { 
            status: 429,
            headers: {
              'Retry-After': body.retryAfter.toString(),
              ...buildRateLimitHeaders({
                remaining: 0,
                resetTime: rateLimitResult.resetTime,
              }),
              'X-RateLimit-Remaining': '0',
            }
          }
        );
      }
      
      return response;
    }

    // Allow access to evaluate page with token parameter (for external evaluators)
    if (isTokenizedEvaluationPath(req)) {
      return response;
    }

    // Always allow access to sign-in page to prevent redirect loops
    if (isSignInPath(pathname)) {
      return response;
    }

    // Detect NextAuth session token (handle split cookies in production and NextAuth v5)
    const hasSessionToken = hasNextAuthSessionToken(req);

    // If no token and trying to access protected routes, redirect to sign in
    if (!hasSessionToken) {
      const signInUrl = new URL('/auth/signin', req.url);
      // SECURITY: Validate pathname before using as callback URL to prevent open redirect
      // Only allow relative paths (already validated by pathname starting with /)
      // Prevent redirect loops by not setting callbackUrl if it's already /auth/signin
      if (canUsePathnameAsCallback(pathname)) {
        signInUrl.searchParams.set('callbackUrl', pathname);
      }
      return NextResponse.redirect(signInUrl);
    }

    // Let page components handle permission checks
    return response;
  } catch (error) {
    console.error('[MIDDLEWARE] Error:', error);
    // On error, allow the request to continue to prevent blocking the application
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    '/((?!api/auth|api/public|api-docs|api/upload-queue/process|_next/static|_next/image|favicon.ico|api/).*)',
    "/api/protected/:path*",
  ],
};
