import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { hasPermission } from '@/lib/permissions';

export async function requirePositionViewSession() {
  const session = await auth();
  if (!session?.user?.id) {
    console.error('[Positions API] Unauthorized access attempt');
    return {
      ok: false as const,
      response: NextResponse.json({ message: 'Unauthorized' }, { status: 401 }),
    };
  }

  if (!hasPermission(session.user, 'POSITIONS_VIEW')) {
    console.error(`[Positions API] Forbidden access attempt by user ${session.user.id} - missing POSITIONS_VIEW permission`);
    return {
      ok: false as const,
      response: NextResponse.json({ message: 'Forbidden: Insufficient permissions to view positions' }, { status: 403 }),
    };
  }

  return { ok: true as const, session };
}

export async function getPositionActor() {
  const session = await auth();
  const actingUserId = session?.user?.id;

  return {
    session,
    actingUserId,
    actingUserName: (session?.user?.name || session?.user?.email || actingUserId || 'System') as string,
    actingUserRole: session?.user?.role,
    modulePermissions: session?.user?.modulePermissions || [],
  };
}
