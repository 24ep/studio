// src/app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';
export const dynamic = "force-dynamic";
const handler = NextAuth(authOptions);
/**
 * @openapi
 * /api/auth/[...nextauth]:
 *   get:
 *     summary: Get current session (NextAuth)
 *     description: Returns the current authenticated session if available. Used to check if a user is logged in.
 *     responses:
 *       200:
 *         description: Session data or null if not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *   post:
 *     summary: User login or signout (NextAuth)
 *     description: Login (with credentials or OAuth) or signout (with provider-specific body). The request body depends on the provider and action.
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Login or signout successful
 *       401:
 *         description: Invalid credentials or not authenticated
 */
export { handler as GET, handler as POST };
