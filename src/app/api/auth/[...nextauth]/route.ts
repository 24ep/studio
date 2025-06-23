// src/app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = "force-dynamic";

const handler = NextAuth(authOptions);

/**
 * @openapi
 * /api/auth/[...nextauth]:
 *   post:
 *     summary: User login (NextAuth)
 *     description: Login endpoint for credentials or OAuth providers. The request body depends on the provider.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful (session or redirect)
 *       401:
 *         description: Invalid credentials
 */

export { handler as GET, handler as POST };