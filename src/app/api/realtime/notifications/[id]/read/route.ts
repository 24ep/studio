import { NextResponse, type NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { markNotificationAsRead } from '@/lib/redis';
import { authOptions } from '@/lib/auth';

function extractIdFromUrl(request: NextRequest): string | null {
  const match = request.nextUrl.pathname.match(/\/notifications\/([^/]+)\/read/);
  return match ? match[1] : null;
}

/**
 * @openapi
 * /api/realtime/notifications/{id}/read:
 *   post:
 *     summary: Mark a notification as read
 *     description: Marks a notification as read for the current user. Requires authentication.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the notification
 *         example: "uuid"
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
 *             examples:
 *               success:
 *                 summary: Example response
 *                 value:
 *                   success: true
 *       400:
 *         description: Missing notification ID
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Failed to mark notification as read
 */
export async function POST(request: NextRequest) {
  const id = extractIdFromUrl(request);
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    if (!id) {
      return NextResponse.json({ error: 'Missing notification ID' }, { status: 400 });
    }

    await markNotificationAsRead(session.user.id, id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return NextResponse.json({ 
      error: 'Failed to mark notification as read',
      details: (error as Error).message 
    }, { status: 500 });
  }
} 