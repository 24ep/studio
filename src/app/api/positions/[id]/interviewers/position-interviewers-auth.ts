import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { hasPermission } from '@/lib/permissions';
import { validateUuid } from '@/lib/security';

export async function requirePositionInterviewersViewSession() {
  const session = await auth();
  if (!session?.user?.id) {
    console.error('[Position Interviewers API] Unauthorized access attempt');
    return {
      ok: false as const,
      response: NextResponse.json({ message: 'Unauthorized' }, { status: 401 }),
    };
  }

  if (!hasPermission(session.user, 'POSITIONS_VIEW')) {
    console.error(`[Position Interviewers API] Forbidden access attempt by user ${session.user.id} - missing POSITIONS_VIEW permission`);
    return {
      ok: false as const,
      response: NextResponse.json(
        { message: 'Forbidden: Insufficient permissions to view positions' },
        { status: 403 }
      ),
    };
  }

  return { ok: true as const, session };
}

export async function requirePositionInterviewersEditSession() {
  const session = await auth();
  const actingUserId = session?.user?.id;
  const actingUserName = (session?.user?.name || session?.user?.email || actingUserId || 'System') as string;

  if (!actingUserId) {
    return {
      ok: false as const,
      response: NextResponse.json({ message: 'Unauthorized' }, { status: 401 }),
    };
  }

  if (!validateUuid(actingUserId)) {
    console.error('[Position Interviewers API] Invalid actingUserId format:', actingUserId);
    return {
      ok: false as const,
      response: NextResponse.json(
        { message: 'Invalid user session. Please sign out and sign in again.' },
        { status: 401 }
      ),
    };
  }

  if (!session?.user || (!hasPermission(session.user, 'POSITIONS_EDIT_BASIC') && !hasPermission(session.user, 'POSITIONS_EDIT_DETAILED'))) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { message: 'Forbidden: Insufficient permissions to edit positions' },
        { status: 403 }
      ),
    };
  }

  return { ok: true as const, session, actingUserId, actingUserName };
}
