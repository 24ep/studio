
import { withAuth, type NextRequestWithAuth } from "next-auth/middleware"
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(request: NextRequestWithAuth) {
    // console.log("Middleware token:", request.nextauth.token)
    const userRole = request.nextauth.token?.role;
    const userPermissions = request.nextauth.token?.modulePermissions || [];

    // Specific permission checks for routes *within* protected areas.
    // The main authentication check (redirect if no token) is handled by withAuth.
    if (request.nextUrl.pathname.startsWith("/settings/users") && userRole !== "Admin" && !userPermissions.includes('USERS_MANAGE')) {
      return NextResponse.rewrite(new URL("/?message=You Are not authorized for User Management!", request.url));
    }
    if (request.nextUrl.pathname.startsWith("/settings/logs") && userRole !== "Admin" && !userPermissions.includes('LOGS_VIEW')) {
      return NextResponse.rewrite(new URL("/?message=You Are not authorized for Logs!", request.url));
    }
    if (request.nextUrl.pathname.startsWith("/settings/stages") && userRole !== "Admin" && !userPermissions.includes('RECRUITMENT_STAGES_MANAGE')) {
      return NextResponse.rewrite(new URL("/?message=You Are not authorized for Stage Management!", request.url));
    }
    if (request.nextUrl.pathname.startsWith("/settings/preferences") && userRole !== "Admin" && !userPermissions.includes('SYSTEM_SETTINGS_MANAGE')) {
       return NextResponse.rewrite(new URL("/?message=You Are not authorized for Preferences!", request.url));
    }
    // If a user tries to access any /settings/* page and they are not an Admin
    // AND they don't have at least one general _MANAGE or _VIEW permission,
    // it's likely they shouldn't be in settings at all.
    // However, individual settings pages might have more granular checks or some might be more open.
    // The canAccess logic in SettingsLayout is the primary UI guard.
    // This middleware check is a broader server-side guard.
    if (request.nextUrl.pathname.startsWith("/settings") && userRole !== "Admin" &&
        !userPermissions.some(p => p.endsWith('_MANAGE') || p.endsWith('_VIEW'))) {
      // Consider redirecting to dashboard or a general access denied page for settings.
      // For now, let the page-level or layout guards handle UI.
      // If stricter server-side denial for *all* /settings is needed if not Admin/no specific perm, that logic goes here.
    }

    // Allow the request to proceed if none of the above conditions are met
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token // If no token, user is not authorized, redirect to signIn page
    },
    pages: {
      signIn: "/auth/signin", // Ensure NextAuth knows where to redirect for sign-in
    }
  }
)

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - auth/signin (the sign-in page itself)
     * - setup-guidance (the database setup guidance page)
     * - Any other public static assets (e.g., images in /public might be matched by 'images/')
     * This regex aims to protect all application routes by default.
     */
    '/((?!api|_next/static|_next/image|favicon.ico|auth/signin|setup-guidance|images).*)',
    // Explicitly list top-level routes if the regex proves too complex or misses cases.
    // e.g., "/", "/candidates/:path*", "/positions/:path*", "/my-tasks/:path*", "/settings/:path*"
    // However, the negative lookahead should cover these.
  ],
};
