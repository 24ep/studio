import { type NextRequest, NextResponse } from 'next/server';
import { hasPermission } from '@/lib/permissions';
import { auth } from '@/auth';
import { readRequestJsonObject } from '@/lib/request-json';
import { 
  setUserPresence, 
  getAllUserPresence, 
  markUserOffline, 
  cleanupOfflineUsers,
} from '@/lib/presence-store';
import {
  createPresenceFromBody,
  getErrorMessage,
  getStringField,
  isRecord,
  serializePresenceUsers,
} from './presence-route-utils';

export const dynamic = 'force-dynamic';

async function requirePresenceAccess(action: string) {
  const session = await auth();
  
  if (!session?.user) {
    return { ok: false as const, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  if (!hasPermission(session.user, 'applicantS_VIEW')) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: `Forbidden: Insufficient permissions to ${action}` }, { status: 403 }),
    };
  }

  return { ok: true as const, session };
}

/**
 * @openapi
 * /api/realtime/presence:
 *   get:
 *     summary: Get presence information for all users
 *     responses:
 *       200:
 *         description: Presence data for all users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       userId:
 *                         type: string
 *                       userName:
 *                         type: string
 *                       userRole:
 *                         type: string
 *                       avatarUrl:
 *                         type: string
 *                       personalColor:
 *                         type: string
 *                       currentPage:
 *                         type: string
 *                       lastSeen:
 *                         type: string
 *                       isOnline:
 *                         type: boolean
 *   post:
 *     summary: Update presence information for current user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *               userName:
 *                 type: string
 *               userRole:
 *                 type: string
 *               avatarUrl:
 *                 type: string
 *               personalColor:
 *                 type: string
 *               currentPage:
 *                 type: string
 *     responses:
 *       200:
 *         description: Presence updated
 *   delete:
 *     summary: Remove presence information for current user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Presence removed
 */

export async function POST(request: NextRequest) {
  const access = await requirePresenceAccess('update presence');
  if (!access.ok) {
    return access.response;
  }

  try {
    const body = await readRequestJsonObject(request);
    if (Object.keys(body).length === 0) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const presenceResult = createPresenceFromBody(body, access.session.user);
    if (!presenceResult.ok) {
      return NextResponse.json({ error: presenceResult.error }, { status: 400 });
    }

    setUserPresence(presenceResult.presence.userId, presenceResult.presence);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to update presence',
      details: getErrorMessage(error),
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const access = await requirePresenceAccess('remove presence');
  if (!access.ok) {
    return access.response;
  }

  try {
    const body = await readRequestJsonObject(request);
    const userId = getStringField(body, 'userId');

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    markUserOffline(userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to remove presence',
      details: getErrorMessage(error),
    }, { status: 500 });
  }
}

export async function GET() {
  const access = await requirePresenceAccess('view presence data');
  if (!access.ok) {
    return access.response;
  }

  try {
    cleanupOfflineUsers();

    const users = serializePresenceUsers(getAllUserPresence());

    return NextResponse.json({ users });
  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to get online users',
      details: getErrorMessage(error),
    }, { status: 500 });
  }
} 

