import { withAuth } from "next-auth/middleware"

export default withAuth({
  pages: {
    signIn: "/auth/signin",
  },
  callbacks: {
    authorized: ({ token }) => !!token, // Only allow if authenticated
  },
})

export const config = {
  matcher: [
    // Protect all routes except sign-in and static assets
    '/((?!_next/static|_next/image|favicon.ico|auth/signin|images).*)',
  ],
};
