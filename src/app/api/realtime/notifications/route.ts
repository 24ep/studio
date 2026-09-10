import { NextRequest, NextResponse } from 'next/server';
import { logAudit } from '@/lib/auditLog';
import prisma from '@/lib/prisma';
import { broadcastNotification } from '@/lib/simple-broadcaster';
import { getJsonObject, getJsonString } from '@/lib/json-types';
import { readRequestJsonObject } from '@/lib/request-json';

import { auth } from '@/auth';
export const dynamic = 'force-dynamic';


/**
 * @openapi
 * /api/realtime/notifications:
 *   get:
 *     summary: Get notifications
 *     responses:
 *       200:
 *         description: List of notifications
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *   post:
 *     summary: Create a notification
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Notification created
 */

export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });       
  }

  const actingUserId = session.user.id;
  const actingUserName = (session.user.name || session.user.email || actingUserId || 'System') as string;   

  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const unreadOnly = searchParams.get('unread') === 'true';

    // Get notifications from database
    const notifications = await prisma.notification.findMany({
      where: {
        userId: actingUserId,
        ...(unreadOnly && { isRead: false })
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    });



    return NextResponse.json(notifications);
  } catch (error) {
    console.error('Error getting notifications:', error);
    await logAudit('ERROR', `Failed to get notifications for ${actingUserName}. Error: ${(error as Error).message}`, 'API:Realtime:Notifications:Get', actingUserId, {
      error: (error as Error).message
    });
    return NextResponse.json({
      error: 'Failed to get notifications',
      details: (error as Error).message
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });       
  }

  const actingUserId = session.user.id;
  const actingUserName = (session.user.name || session.user.email || actingUserId || 'System') as string;   

  try {
    const body = await readRequestJsonObject(request);
    const type = getJsonString(body, 'type');
    const targetUserId = getJsonString(body, 'targetUserId');
    const title = getJsonString(body, 'title');
    const message = getJsonString(body, 'message');
    const data = getJsonObject(body, 'data');

    if (!type || !title || !message) {
      await logAudit('WARN', `Notification creation attempted with missing fields by ${actingUserName}`, 'API:Realtime:Notifications:Post', actingUserId, {     
        providedFields: { type, title, message, targetUserId: !!targetUserId, hasData: !!data }
      });
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Prevent self-notifications: don't notify users about their own actions
    if (targetUserId && targetUserId === actingUserId) {
      await logAudit('AUDIT', `Self-notification prevented for ${actingUserName}`, 'API:Realtime:Notifications:Post', actingUserId, {
        notificationType: type,
        title,
        targetUserId,
        hasData: !!data
      });
      return NextResponse.json({ success: true, message: 'Self-notification prevented' });
    }

    // Create notification in database
    const newNotification = await prisma.notification.create({
      data: {
        userId: targetUserId || actingUserId,
        type,
        title,
        message,
        data: data || {},
      }
    });

    // Broadcast real-time notification
    const targetUser = targetUserId || actingUserId;
    broadcastNotification(newNotification.message, newNotification.type, targetUser);

    await logAudit('AUDIT', `Notification '${title}' created by ${actingUserName}`, 'API:Realtime:Notifications:Post', actingUserId, {
      notificationType: type,
      title,
      targetUserId,
      hasData: !!data
    });

    return NextResponse.json({ success: true, notification: newNotification }); 
  } catch (error) {
    console.error('Error creating notification:', error);
    await logAudit('ERROR', `Failed to create notification by ${actingUserName}. Error: ${(error as Error).message}`, 'API:Realtime:Notifications:Post', actingUserId, {
      error: (error as Error).message
    });
    return NextResponse.json({
      error: 'Failed to create notification',
      details: (error as Error).message
    }, { status: 500 });
  }
} 
