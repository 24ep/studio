import { NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import { auth } from '@/auth';
import { logAudit } from '@/lib/auditLog';
import { hasPermission, type SessionLikeUser } from '@/lib/permissions';

type UserGroupsPermission = 'USER_GROUPS_VIEW' | 'USER_GROUPS_CREATE';
type UserGroupsSession = Session & {
  user: Session['user'] & SessionLikeUser & {
    id?: string;
    email?: string | null;
  };
};

export async function requireUserGroupsSession(unauthorizedResponse: 'json' | 'text') {
  const session = await auth();
  const actingUserId = session?.user?.id;

  if (!actingUserId) {
    return {
      ok: false as const,
      response: unauthorizedResponse === 'json'
        ? NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
        : new NextResponse('Unauthorized', { status: 401 }),
    };
  }

  return { ok: true as const, session, actingUserId };
}

export async function requireUserGroupsPermission(
  session: UserGroupsSession,
  permission: UserGroupsPermission,
  auditAction: string,
  auditVerb: string
) {
  if (hasPermission(session.user, permission)) {
    return null;
  }

  await logAudit(
    'WARN',
    `Forbidden attempt to ${auditVerb} user groups by user ${session?.user?.email || 'Unknown'}.`,
    auditAction,
    session?.user?.id
  );
  return NextResponse.json({ message: 'Forbidden: Insufficient permissions' }, { status: 403 });
}
