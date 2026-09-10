import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { logAudit } from '@/lib/auditLog';
import { hasPermission } from '@/lib/permissions';

import { auth } from '@/auth';
import { isJsonObject } from '@/lib/json-types';
import { readRequestJsonObject } from '@/lib/request-json';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * @openapi
 * /api/users/{id}/toggle-status:
 *   post:
 *     summary: Toggle user active status
 *     description: Enable or disable a user account
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               isActive:
 *                 type: boolean
 *                 description: New active status
 *     responses:
 *       200:
 *         description: User status updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: User not found
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to manage users
    if (!hasPermission(session.user, 'USERS_EDIT')) {
      return NextResponse.json({ message: 'Forbidden: Insufficient permissions' }, { status: 403 });
    }

    const resolvedParams = await params;
    const userId = resolvedParams.id;
    const body = await readRequestJsonObject(request);
    const isActive = isJsonObject(body) ? body.isActive : undefined;

    if (typeof isActive !== 'boolean') {
      return NextResponse.json({ message: 'isActive must be a boolean' }, { status: 400 });
    }

    // Prevent users from disabling themselves
    if (session.user.id === userId && !isActive) {
      return NextResponse.json({ message: 'You cannot disable your own account' }, { status: 400 });
    }

    const client = await getPool().connect();
    try {
      // Check if user exists
      const userResult = await client.query('SELECT id, name, email, "is_active" FROM "User" WHERE id = $1', [userId]);
      if (userResult.rows.length === 0) {
        return NextResponse.json({ message: 'User not found' }, { status: 404 });
      }

      const user = userResult.rows[0];
      
      // Update user status
      await client.query('UPDATE "User" SET "is_active" = $1, "updatedAt" = NOW() WHERE id = $2', [isActive, userId]);

      // Log the action
      await logAudit(
        'AUDIT',
        `User ${isActive ? 'enabled' : 'disabled'}: ${user.name} (${user.email})`,
        'USERS_EDIT',
        session.user.id,
        { 
          targetUserId: userId, 
          targetUserName: user.name,
          targetUserEmail: user.email,
          previousStatus: user.is_active,
          newStatus: isActive
        }
      );

      return NextResponse.json({ 
        message: `User ${isActive ? 'enabled' : 'disabled'} successfully`,
        isActive 
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error toggling user status:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
