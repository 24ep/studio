import { withAuth } from "next-auth/middleware";
export default withAuth({
    pages: {
        signIn: "/auth/signin",
    },
    callbacks: {
        authorized: ({ token }) => !!token, // Only allow if authenticated
    },
});
export const config = {
    matcher: [
        // Exclude /api/upload-queue/process from auth
        '/((?!_next/static|_next/image|favicon.ico|auth/signin|api/auth/|api/upload-queue/process|api-docs|api/health|images).*)',
    ],
};
