import { NextRequest, NextResponse } from 'next/server';
import { logAudit } from '@/lib/auditLog';
import { hasPermission } from '@/lib/permissions';
import { unlockUserAccount, getAccountLockoutStatus } from '@/lib/authUtils';

import { auth } from '@/auth';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * @openapi
 * /api/users/{id}/unlock:
 *   post:
 *     summary: Unlock a user account
 *     description: Unlock a user account that has been locked due to too many failed login attempts
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: Account unlocked successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 unlocked:
 *                   type: boolean
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
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

    // Unlock the account
    const success = await unlockUserAccount(userId, session.user.id);

    if (!success) {
      return NextResponse.json({ message: 'Failed to unlock account' }, { status: 500 });
    }

    // Log the action
    await logAudit(
      'AUDIT',
      `User account unlocked by administrator`,
      'USERS_EDIT',
      session.user.id,
      { 
        targetUserId: userId,
        action: 'ACCOUNT_UNLOCKED'
      }
    );

    return NextResponse.json({ 
      message: 'Account unlocked successfully',
      unlocked: true
    });
  } catch (error) {
    console.error('Error unlocking user account:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

/**
 * @openapi
 * /api/users/{id}/unlock:
 *   get:
 *     summary: Get account lockout status
 *     description: Get the current lockout status for a user account
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: Account lockout status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 failedAttempts:
 *                   type: integer
 *                 isLocked:
 *                   type: boolean
 *                 lockedUntil:
 *                   type: string
 *                   format: date-time
 *                   nullable: true
 *                 lastFailedLogin:
 *                   type: string
 *                   format: date-time
 *                   nullable: true
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 *       500:
 *         description: Internal server error
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to view users or is viewing their own status
    const resolvedParams = await params;
    const userId = resolvedParams.id;
    if (session.user.id !== userId && !hasPermission(session.user, 'USERS_VIEW')) {
      return NextResponse.json({ message: 'Forbidden: Insufficient permissions' }, { status: 403 });
    }

    const status = await getAccountLockoutStatus(userId);

    return NextResponse.json(status);
  } catch (error) {
    console.error('Error getting lockout status:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
