import { NextRequest, NextResponse } from "next/server";
import { getToken } from 'next-auth/jwt';
import { prisma } from "@/lib/prisma";

const protectedRoutes = [
  "/api/protected", // Add your protected endpoints here
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip middleware for static files and API routes that don't need session validation
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api-docs') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Check for authentication token
  const token = await getToken({ 
    req: req, 
    secret: process.env.NEXTAUTH_SECRET 
  });

  // If no token and trying to access protected routes, redirect to sign in
  if (!token && !pathname.startsWith('/auth/signin')) {
    const signInUrl = new URL('/auth/signin', req.url);
    signInUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(signInUrl);
  }

  // If token exists but user ID is missing, redirect to sign in
  if (token && !token.id && !pathname.startsWith('/auth/signin')) {
    const signInUrl = new URL('/auth/signin', req.url);
    signInUrl.searchParams.set('callbackUrl', pathname);
    signInUrl.searchParams.set('error', 'SessionExpired');
    return NextResponse.redirect(signInUrl);
  }

  if (protectedRoutes.some(route => pathname.startsWith(route))) {
    const authHeader = req.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const apiKey = authHeader.replace("Bearer ", "");
      const user = await prisma.user.findUnique({ where: { apiKey } });
      if (user) {
        return NextResponse.next();
      }
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (auth API routes)
     * - api-docs (API documentation routes)
     * - api/upload-queue/process (processor API route)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api/auth|api-docs|api/upload-queue/process|_next/static|_next/image|favicon.ico).*)',
    "/api/protected/:path*",
  ],
};
