import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { getUserNotifications, createNotification } from '@/lib/redis';
import { authOptions } from '@/lib/auth';
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
export async function GET(request) {
    const session = await getServerSession(authOptions);
    if (!(session === null || session === void 0 ? void 0 : session.user)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    try {
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '50');
        const notifications = await getUserNotifications(session.user.id, limit);
        return NextResponse.json(notifications);
    }
    catch (error) {
        console.error('Error getting notifications:', error);
        return NextResponse.json({
            error: 'Failed to get notifications',
            details: error.message
        }, { status: 500 });
    }
}
export async function POST(request) {
    const session = await getServerSession(authOptions);
    if (!(session === null || session === void 0 ? void 0 : session.user)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    try {
        const body = await request.json();
        const { type, targetUserId, title, message, data } = body;
        if (!type || !title || !message) {
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
        return NextResponse.json({ success: true });
    }
    catch (error) {
        console.error('Error creating notification:', error);
        return NextResponse.json({
            error: 'Failed to create notification',
            details: error.message
        }, { status: 500 });
    }
}
