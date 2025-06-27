// src/app/api/auth/change-password/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { getPool } from '../../../../lib/db';
import { logAudit } from '@/lib/auditLog';
import { authOptions } from '@/lib/auth';
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
export async function POST(request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;
    let body;
    try {
        body = await request.json();
    }
    catch (e) {
        return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
    }
    const validation = changePasswordSchema.safeParse(body);
    if (!validation.success) {
        return NextResponse.json({ message: 'Invalid input', errors: validation.error.flatten().fieldErrors }, { status: 400 });
    }
    const { currentPassword, newPassword } = validation.data;
    const client = await getPool().connect();
    try {
        const userResult = await client.query('SELECT password FROM "User" WHERE id = $1', [userId]);
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
    }
    catch (error) {
        console.error("Failed to change password:", error);
        await logAudit('ERROR', `Error during password change. Error: ${error.message}`, 'API:Auth:ChangePassword', userId);
        return NextResponse.json({ message: "Error changing password", error: error.message }, { status: 500 });
    }
    finally {
        client.release();
    }
}
