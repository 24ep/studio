import { NextRequest, NextResponse } from 'next/server';
import { logAudit } from '@/lib/auditLog';
import prisma from '@/lib/prisma';
import { validate as validateUuid } from 'uuid';

import { auth } from '@/auth';
export const dynamic = 'force-dynamic';


/**
 * @openapi
 * /api/realtime/notifications/{id}/read:
 *   post:
 *     summary: Mark a notification as read
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notification marked as read
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 notification:
 *                   type: object
 */

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const notificationId = resolvedParams.id;
  
  const session = await auth();

  if (!session?.user) {
    
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });       
  }

  const actingUserId = session.user.id;
  const actingUserName = (session.user.name || session.user.email || actingUserId || 'System') as string;

  // Check if user ID is empty (invalid session)
  if (!actingUserId) {
    console.error('❌ Empty user ID in session for user:', actingUserName);
    return NextResponse.json({ 
      error: 'Invalid session. Please sign in again.',
      details: 'User ID is missing from session'
    }, { status: 401 });
  }

  // Debug logging to identify UUID issues

  // Validate UUIDs before proceeding
  if (!validateUuid(actingUserId)) {
    console.error('❌ Invalid actingUserId UUID:', actingUserId);
    return NextResponse.json({ 
      error: 'Invalid user ID format',
      details: 'User ID is not a valid UUID'
    }, { status: 400 });
  }

  if (!validateUuid(notificationId)) {
    console.error('❌ Invalid notificationId UUID:', notificationId);
    return NextResponse.json({ 
      error: 'Invalid notification ID format',
      details: 'Notification ID is not a valid UUID'
    }, { status: 400 });
  }

  try {
    // Update the notification to mark it as read
    const updatedNotification = await prisma.notification.update({
      where: {
        id: notificationId,
        userId: actingUserId // Ensure user can only mark their own notifications as read
      },
      data: {
        isRead: true
      }
    });

    

    await logAudit('AUDIT', `Notification '${updatedNotification.title}' marked as read by ${actingUserName}`, 'API:Realtime:Notifications:MarkRead', actingUserId, {
      notificationId,
      notificationTitle: updatedNotification.title
    });

    return NextResponse.json({ 
      success: true, 
      notification: updatedNotification 
    });
  } catch (error) {
    console.error('❌ API: Error marking notification as read:', error);
    await logAudit('ERROR', `Failed to mark notification as read for ${actingUserName}. Error: ${(error as Error).message}`, 'API:Realtime:Notifications:MarkRead', actingUserId, {
      notificationId,
      error: (error as Error).message
    });
    return NextResponse.json({
      error: 'Failed to mark notification as read',
      details: (error as Error).message
    }, { status: 500 });
  }
} 