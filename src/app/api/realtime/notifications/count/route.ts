import { NextRequest, NextResponse } from 'next/server';
import { NotificationService } from '@/lib/notificationService';

import { auth } from '@/auth';
export const dynamic = 'force-dynamic';


/**
 * @openapi
 * /api/realtime/notifications/count:
 *   get:
 *     summary: Get unread notification count
 *     responses:
 *       200:
 *         description: Unread notification count
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count:
 *                   type: number
 */

export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const count = await NotificationService.getUnreadCount(session.user.id);
    return NextResponse.json({ count });
  } catch (error) {
    console.error('Error getting notification count:', error);
    return NextResponse.json({
      error: 'Failed to get notification count',
      details: (error as Error).message
    }, { status: 500 });
  }
}
