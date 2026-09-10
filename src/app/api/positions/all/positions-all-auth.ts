import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { hasPermission } from '@/lib/permissions';
import type { PositionAllUserContext } from './positions-all-types';

export async function requirePositionsAllSession() {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      ok: false as const,
      response: NextResponse.json({
        message: 'Unauthorized',
        error: 'Authentication required',
      }, { status: 401 }),
    };
  }

  if (!hasPermission(session.user, 'POSITIONS_VIEW')) {
    return {
      ok: false as const,
      response: NextResponse.json({
        message: 'Forbidden: Insufficient permissions to view positions',
        error: 'Forbidden',
      }, { status: 403 }),
    };
  }

  return {
    ok: true as const,
    user: {
      userId: session.user.id,
      userName: session.user.name || session.user.email || 'Unknown',
      userRole: session.user.role,
      hasViewAllPermission: hasPermission(session.user, 'POSITIONS_VIEW_ALL'),
    } satisfies PositionAllUserContext,
  };
}
