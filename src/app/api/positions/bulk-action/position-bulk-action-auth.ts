import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { logAudit } from '@/lib/auditLog';
import { hasPermission, type SessionLikeUser } from '@/lib/permissions';

type PositionBulkActionUser = SessionLikeUser & {
  id?: string;
  name?: string | null;
  email?: string | null;
};

type PositionBulkActionSession = {
  user?: PositionBulkActionUser;
} | null;

export async function getPositionBulkActionSession(): Promise<PositionBulkActionSession> {
  return (await auth()) as PositionBulkActionSession;
}

export function getPositionBulkActionActingUser(session: PositionBulkActionSession) {
  const actingUserId = session?.user?.id;
  const actingUserName = session?.user?.name || session?.user?.email || actingUserId || 'System';
  return { actingUserId, actingUserName };
}

export async function requirePositionBulkActionPermission(
  session: PositionBulkActionSession,
  actionType: unknown,
  actingUserId: string | undefined,
  actingUserName: string
) {
  const hasRequiredPermission = hasPositionBulkActionPermission(session, actionType);
  if (actingUserId && hasRequiredPermission) {
    return null;
  }

  await logAudit(
    'WARN',
    `Forbidden attempt to perform bulk position action '${actionType}' by ${actingUserName}.`,
    'API:Positions:BulkAction',
    actingUserId
  );
  return NextResponse.json({ message: 'Forbidden: Insufficient permissions.' }, { status: 403 });
}

function hasPositionBulkActionPermission(session: PositionBulkActionSession, actionType: unknown) {
  switch (actionType) {
    case 'delete':
      return !!session?.user && hasPermission(session.user, 'POSITIONS_DELETE');
    case 'change_status':
      return !!session?.user && hasPermission(session.user, 'POSITIONS_EDIT_BASIC');
    case 'update_match_criteria':
      return !!session?.user && hasPermission(session.user, 'POSITIONS_EDIT_DETAILED');
    default:
      return false;
  }
}
