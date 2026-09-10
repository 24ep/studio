export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { logAudit } from '@/lib/auditLog';
import prisma from '@/lib/prisma';
import { validate as validateUuid } from 'uuid';

import { auth } from '@/auth';
/**
 * @openapi
 * /api/realtime/notifications/mark-all-read:
 *   post:
 *     summary: Mark all notifications as read
 *     responses:
 *       200:
 *         description: All notifications marked as read
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 updatedCount:
 *                   type: number
 */

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });       
  }

  const actingUserId = session.user.id;
  const actingUserName = (session.user.name || session.user.email || actingUserId || 'System') as string;   

  // Check if user ID is empty (invalid session)
  if (!actingUserId) {
    console.error('? Empty user ID in session for user:', actingUserName);
    return NextResponse.json({ 
      error: 'Invalid session. Please sign in again.',
      details: 'User ID is missing from session'
    }, { status: 401 });
  }


  // Validate UUID before proceeding
  if (!validateUuid(actingUserId)) {
    console.error('? Invalid actingUserId UUID:', actingUserId);
    return NextResponse.json({ 
      error: 'Invalid user ID format',
      details: 'User ID is not a valid UUID'
    }, { status: 400 });
  }

  try {
    // Update all unread notifications for the user
    const result = await prisma.notification.updateMany({
      where: {
        userId: actingUserId,
        isRead: false
      },
      data: {
        isRead: true
      }
    });

    await logAudit('AUDIT', `All notifications marked as read by ${actingUserName}. Updated ${result.count} notifications.`, 'API:Realtime:Notifications:MarkAllRead', actingUserId, {
      updatedCount: result.count
    });

    return NextResponse.json({ 
      success: true, 
      updatedCount: result.count 
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    await logAudit('ERROR', `Failed to mark all notifications as read for ${actingUserName}. Error: ${(error as Error).message}`, 'API:Realtime:Notifications:MarkAllRead', actingUserId, {
      error: (error as Error).message
    });
    return NextResponse.json({
      error: 'Failed to mark all notifications as read',
      details: (error as Error).message
    }, { status: 500 });
  }
}
