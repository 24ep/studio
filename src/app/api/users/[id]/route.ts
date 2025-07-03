// src/app/api/users/[id]/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { logAudit } from '@/lib/auditLog';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { removeUserPresence } from '@/lib/redis';

const updateUserSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  email: z.string().email("A valid email is required").optional(),
  role: z.enum(['Admin', 'Recruiter', 'Hiring Manager']).optional(),
  password: z.string().min(8, "Password must be at least 8 characters").optional(),
  authenticationMethod: z.enum(['basic', 'azure']).optional(),
  forcePasswordChange: z.boolean().optional(),
  newPassword: z.string().min(8, "New password must be at least 8 characters").optional(),
});

function extractIdFromUrl(request: NextRequest): string | null {
  const match = request.nextUrl.pathname.match(/\/users\/([^/]+)/);
  return match ? match[1] : null;
}

/**
 * @openapi
 * /api/users/{id}:
 *   get:
 *     summary: Get a user by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the user
 *     responses:
 *       200:
 *         description: User details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 */
export async function GET(request: NextRequest) {
    const id = extractIdFromUrl(request);
    if (!id) {
        return NextResponse.json({ message: "Invalid user ID" }, { status: 400 });
    }
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                avatarUrl: true,
                authenticationMethod: true,
                forcePasswordChange: true,
                createdAt: true,
                updatedAt: true
            }
        });

        if (!user) {
            return NextResponse.json({ message: "User not found" }, { status: 404 });
        }
        return NextResponse.json(user, { status: 200 });
    } catch (error: any) {
        console.error(`Failed to fetch user ${id}:`, error);
        return NextResponse.json({ message: "Error fetching user", error: error.message }, { status: 500 });
    }
}

/**
 * @openapi
 * /api/users/{id}:
 *   put:
 *     summary: Update a user by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       200:
 *         description: User updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 */
export async function PUT(request: NextRequest) {
    const id = extractIdFromUrl(request);
    if (!id) {
        return NextResponse.json({ message: "Invalid user ID" }, { status: 400 });
    }
    const session = await getServerSession(authOptions);
    const actingUserId = session?.user?.id;
    if (!actingUserId) {
        return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    let body;
    try {
        body = await request.json();
    } catch (error: any) {
        return NextResponse.json({ message: "Error parsing request body", error: error.message }, { status: 400 });
    }

    const validationResult = updateUserSchema.safeParse(body);
    if (!validationResult.success) {
        return NextResponse.json({ message: "Invalid input", errors: validationResult.error.flatten().fieldErrors }, { status: 400 });
    }

    const { password, newPassword, ...fieldsToUpdate } = validationResult.data;

    if (Object.keys(fieldsToUpdate).length === 0 && !password && !newPassword) {
        return NextResponse.json({ message: "No fields to update." }, { status: 400 });
    }
    
    try {
        const updateData: any = { ...fieldsToUpdate };
        
        // Handle password updates
        if (password) {
            const saltRounds = 10;
            updateData.password = await bcrypt.hash(password, saltRounds);
        }
        
        if (newPassword) {
            const saltRounds = 10;
            updateData.password = await bcrypt.hash(newPassword, saltRounds);
        }

        const updatedUser = await prisma.user.update({
            where: { id },
            data: updateData,
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                authenticationMethod: true,
                forcePasswordChange: true,
                createdAt: true,
                updatedAt: true
            }
        });

        await logAudit('AUDIT', `User '${updatedUser.name}' (ID: ${id}) was updated.`, 'API:Users:Update', actingUserId, { targetUserId: id, changes: validationResult.data });
        return NextResponse.json(updatedUser, { status: 200 });

    } catch (error: any) {
        console.error(`Failed to update user ${id}:`, error);
        await logAudit('ERROR', `Failed to update user (ID: ${id}). Error: ${error.message}`, 'API:Users:Update', actingUserId, { targetUserId: id, input: body });
        
        if (error.code === 'P2025') {
            return NextResponse.json({ message: "User not found" }, { status: 404 });
        }
        
        return NextResponse.json({ message: "Error updating user", error: error.message }, { status: 500 });
    }
}

/**
 * Invalidates sessions for a deleted user by clearing their presence data
 * @param userId - The ID of the user whose sessions should be invalidated
 */
async function invalidateUserSessions(userId: string): Promise<void> {
  try {
    // Remove user presence from Redis
    await removeUserPresence(userId);
    
    // Note: NextAuth sessions are JWT-based and stored client-side
    // We can't directly invalidate them server-side, but we can:
    // 1. Clear presence data (done above)
    // 2. Add validation checks in API routes (already implemented)
    // 3. Consider implementing a session blacklist if needed
    
    console.log(`Session cleanup completed for user ${userId}`);
  } catch (error) {
    console.error(`Failed to cleanup sessions for user ${userId}:`, error);
  }
}

/**
 * @openapi
 * /api/users/{id}:
 *   delete:
 *     summary: Delete a user by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the user
 *     responses:
 *       200:
 *         description: User deleted
 *       404:
 *         description: User not found
 */
export async function DELETE(request: NextRequest) {
    const id = extractIdFromUrl(request);
    if (!id) {
        return NextResponse.json({ message: "Invalid user ID" }, { status: 400 });
    }
    const session = await getServerSession(authOptions);
    const actingUserId = session?.user?.id;
     if (!actingUserId) {
        return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    try {
        const deletedUser = await prisma.user.delete({
            where: { id },
            select: {
                id: true,
                name: true
            }
        });

        // Cleanup sessions for the deleted user
        await invalidateUserSessions(id);

        await logAudit('AUDIT', `User '${deletedUser.name}' (ID: ${id}) was deleted.`, 'API:Users:Delete', actingUserId, { targetUserId: id });
        return NextResponse.json({ message: "User deleted successfully" }, { status: 200 });
    } catch (error: any) {
        console.error(`Failed to delete user ${id}:`, error);
        await logAudit('ERROR', `Failed to delete user (ID: ${id}). Error: ${error.message}`, 'API:Users:Delete', actingUserId, { targetUserId: id });
        
        if (error.code === 'P2025') {
            return NextResponse.json({ message: "User not found" }, { status: 404 });
        }
        
        return NextResponse.json({ message: "Error deleting user", error: error.message }, { status: 500 });
    }
}
