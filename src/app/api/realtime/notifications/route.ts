import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { getUserNotifications, createNotification } from '@/lib/redis';
import { authOptions } from '@/lib/auth';
import { logAudit } from '@/lib/auditLog';

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
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const actingUserId = session.user.id;
  const actingUserName = session.user.name || session.user.email || 'System';

  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');

    const notifications = await getUserNotifications(session.user.id, limit);
    
    await logAudit('AUDIT', `Notifications accessed by ${actingUserName}. Retrieved ${notifications.length} notifications.`, 'API:Realtime:Notifications:Get', actingUserId, { 
      limit,
      notificationCount: notifications.length 
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
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const actingUserId = session.user.id;
  const actingUserName = session.user.name || session.user.email || 'System';

  try {
    const body = await request.json();
    const { type, targetUserId, title, message, data } = body;

    if (!type || !title || !message) {
      await logAudit('WARN', `Notification creation attempted with missing fields by ${actingUserName}`, 'API:Realtime:Notifications:Post', actingUserId, { 
        providedFields: { type, title, message, targetUserId: !!targetUserId, hasData: !!data } 
      });
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await createNotification({
      type,
      userId: session.user.id,
      targetUserId,
      title,
      message,
      data: data || {},
    });

    await logAudit('AUDIT', `Notification '${title}' created by ${actingUserName}`, 'API:Realtime:Notifications:Post', actingUserId, { 
      notificationType: type,
      title,
      targetUserId,
      hasData: !!data 
    });

    return NextResponse.json({ success: true });
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