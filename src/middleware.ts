
import { withAuth, NextRequestWithAuth } from "next-auth/middleware"
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(request: NextRequestWithAuth) {
    // console.log("Middleware token:", request.nextauth.token)
    const userRole = request.nextauth.token?.role;
    const userPermissions = request.nextauth.token?.modulePermissions || [];

    if (request.nextUrl.pathname.startsWith("/settings/users") && userRole !== "Admin" && !userPermissions.includes('USERS_MANAGE')) {
      return NextResponse.rewrite(new URL("/?message=You Are not authorized for User Management!", request.url));
    }
    if (request.nextUrl.pathname.startsWith("/settings/logs") && userRole !== "Admin" && !userPermissions.includes('LOGS_VIEW')) {
      return NextResponse.rewrite(new URL("/?message=You Are not authorized for Logs!", request.url));
    }
    // Example for another settings page, adapt as needed for all settings sub-pages
    if (request.nextUrl.pathname.startsWith("/settings/stages") && userRole !== "Admin" && !userPermissions.includes('RECRUITMENT_STAGES_MANAGE')) {
      return NextResponse.rewrite(new URL("/?message=You Are not authorized for Stage Management!", request.url));
    }
    if (request.nextUrl.pathname.startsWith("/settings/preferences") && userRole !== "Admin" && !userPermissions.includes('SYSTEM_SETTINGS_MANAGE')) {
       return NextResponse.rewrite(new URL("/?message=You Are not authorized for Preferences!", request.url));
    }
    // Add more specific settings path checks here
    // General /settings catch-all could be too broad if some settings pages are more open
    if (request.nextUrl.pathname.startsWith("/settings") && userRole !== "Admin" && 
        !userPermissions.some(p => p.endsWith('_MANAGE') || p.endsWith('_VIEW'))) { // A very basic check
      // return NextResponse.rewrite(new URL("/?message=You Are not authorized for Settings!", request.url));
    }
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token
    },
  }
)

export const config = {
  matcher: [
    // Apply broadly to /settings and its sub-pages
    // More specific checks are done within the middleware function
    "/settings/:path*", 
    // "/admin/:path*", // Example if you had an /admin route
    // Individual pages outside /settings that need protection
    // "/users/:path*", // This is now /settings/users
    // "/api-docs/:path*", // This is now /settings/api-docs
    // "/logs/:path*", // This is now /settings/logs
  ], // Correctly closed matcher array
}; // Correctly closed config object
