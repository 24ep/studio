// src/app/api/auth/change-password/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { getPool } from '../../../../lib/db';
import { logAudit } from '@/lib/auditLog';
import { auth } from '@/auth';
import { readRequestJsonResult } from '@/lib/request-json';
import type { QueryResultRow } from 'pg';
export const dynamic = 'force-dynamic';

type PasswordRow = QueryResultRow & {
    password: string;
};

function getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
});

/**
 * @openapi
 * /api/auth/change-password:
 *   post:
 *     summary: Change user password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               oldPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password changed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
export async function POST(request: NextRequest) {
    // SECURITY: Rate limiting for password change endpoint
    const { applyRateLimit, authRateLimiter } = await import('@/lib/rateLimiter');
    const rateLimitResult = applyRateLimit(request, authRateLimiter);
    if (!rateLimitResult.allowed) {
        return NextResponse.json(
            { 
                message: 'Too many password change attempts. Please try again later.',
                retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
            },
            { 
                status: 429,
                headers: {
                    'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString(),
                }
            }
        );
    }

    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    // SECURITY: Check request body size to prevent DoS attacks
    const contentLength = request.headers.get('content-length');
    if (contentLength) {
        const { securityConfig } = await import('@/lib/securityConfig');
        const maxSize = securityConfig.requestBody?.maxJsonSize || 10 * 1024 * 1024; // 10MB
        const size = parseInt(contentLength, 10);
        if (size > maxSize) {
            return NextResponse.json({ 
                message: `Request body too large. Maximum size is ${maxSize / (1024 * 1024)}MB` 
            }, { status: 413 });
        }
    }

    const bodyResult = await readRequestJsonResult(request);
    if (!bodyResult.ok) {
        return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
    }
    
    const validation = changePasswordSchema.safeParse(bodyResult.value);
    if (!validation.success) {
        return NextResponse.json({ message: 'Invalid input', errors: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { currentPassword, newPassword } = validation.data;

    // SECURITY: Validate password strength
    const { validatePassword } = await import('@/lib/security');
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
        await logAudit('WARN', `User attempted to set weak password.`, 'API:Auth:ChangePassword', userId);
        return NextResponse.json({ 
            message: 'Password does not meet security requirements', 
            errors: passwordValidation.errors 
        }, { status: 400 });
    }
    
    const client = await getPool().connect();
    try {
        const userResult = await client.query<PasswordRow>('SELECT password FROM "User" WHERE id = $1', [userId]);
        if (userResult.rowCount === 0) {
            return NextResponse.json({ message: "User not found" }, { status: 404 });
        }
        const storedHash = userResult.rows[0].password;

        const isMatch = await bcrypt.compare(currentPassword, storedHash);
        if (!isMatch) {
            await logAudit('WARN', `User failed to change password (incorrect current password).`, 'API:Auth:ChangePassword', userId);
            return NextResponse.json({ message: "Incorrect current password" }, { status: 400 });
        }

        const newHashedPassword = await bcrypt.hash(newPassword, 10);
        await client.query('UPDATE "User" SET password = $1, "updatedAt" = NOW() WHERE id = $2', [newHashedPassword, userId]);
        
        await logAudit('AUDIT', `User successfully changed their password.`, 'API:Auth:ChangePassword', userId);
        return NextResponse.json({ message: "Password changed successfully" });
    } catch (error) {
        console.error("Failed to change password:", error);
        const errorMessage = getErrorMessage(error);
        await logAudit('ERROR', `Error during password change. Error: ${errorMessage}`, 'API:Auth:ChangePassword', userId);
        return NextResponse.json({ message: "Error changing password", error: errorMessage }, { status: 500 });
    } finally {
        client.release();
    }
}
