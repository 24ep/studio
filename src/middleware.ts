
import { withAuth, NextRequestWithAuth } from "next-auth/middleware"
import { NextResponse } from 'next/server'

export default withAuth(
  // `withAuth` augments your `NextRequest` with the `nextauth` property.
  function middleware(request: NextRequestWithAuth) {
    // console.log(request.nextauth.token)
    if (request.nextUrl.pathname.startsWith("/admin")
      && request.nextauth.token?.role !== "Admin") {
      return NextResponse.rewrite(
        new URL("/?message=You Are not authorized!", request.url)
      )
    }
    if (request.nextUrl.pathname.startsWith("/settings")
      && request.nextauth.token?.role !== "Admin") {
         if (!request.nextauth.token?.modulePermissions?.includes('SYSTEM_SETTINGS_MANAGE')) {
            return NextResponse.rewrite(
                new URL("/?message=You Are not authorized!", request.url)
            )
         }
    }
  },
  // added callback to avoid redirect loop
  {
    callbacks: {
      authorized: ({ token }) => !!token
    },
  }
)

// Applying the middleware to the routes that need it.
export const config = {
  matcher: [
    "/admin/:path*",
    "/settings/:path*",
    "/users/:path*",
    "/api/users/:path*",
  ]
}
