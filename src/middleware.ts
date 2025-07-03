import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static files and API routes that don't need session validation
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Check for authentication token
  const token = await getToken({ 
    req: request, 
    secret: process.env.NEXTAUTH_SECRET 
  });

  // If no token and trying to access protected routes, redirect to sign in
  if (!token && !pathname.startsWith('/auth/signin')) {
    const signInUrl = new URL('/auth/signin', request.url);
    signInUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(signInUrl);
  }

  // If token exists but is invalid (user doesn't exist), redirect to sign in
  if (token?.id && !pathname.startsWith('/auth/signin')) {
    try {
      // Quick validation - we'll do a more thorough check in the API routes
      // This is just to catch obvious cases and redirect to sign in
      const response = await fetch(`${request.nextUrl.origin}/api/auth/validate-session`, {
        headers: {
          'Authorization': `Bearer ${token.id}`,
        },
      });
      
      if (!response.ok) {
        const signInUrl = new URL('/auth/signin', request.url);
        signInUrl.searchParams.set('callbackUrl', pathname);
        signInUrl.searchParams.set('error', 'SessionExpired');
        return NextResponse.redirect(signInUrl);
      }
    } catch (error) {
      // If validation fails, continue with the request
      // The API routes will handle the detailed validation
      console.warn('Session validation failed in middleware:', error);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (auth API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
};
