import { NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import { auth } from '@/auth';
import { logAudit } from '@/lib/auditLog';
import { hasPermission, type SessionLikeUser } from '@/lib/permissions';

type UserGroupMembersPermission = 'USER_GROUPS_VIEW' | 'USER_GROUPS_EDIT';
type UserGroupMembersSession = Session & {
  user: Session['user'] & SessionLikeUser & {
    id?: string;
    email?: string | null;
  };
};

export async function requireUserGroupMembersSession() {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      ok: false as const,
      response: NextResponse.json({ message: 'Unauthorized' }, { status: 401 }),
    };
  }

  return { ok: true as const, session };
}

export async function requireUserGroupMembersPermission(
  session: UserGroupMembersSession,
  permission: UserGroupMembersPermission,
  auditAction: string,
  auditMessage: string,
  auditContext: Record<string, unknown>
) {
  if (hasPermission(session.user, permission)) {
    return null;
  }

  await logAudit(
    'WARN',
    `${auditMessage} by user ${session.user.email}.`,
    auditAction,
    session.user.id,
    auditContext
  );
  return NextResponse.json({ message: 'Forbidden: Insufficient permissions' }, { status: 403 });
}
