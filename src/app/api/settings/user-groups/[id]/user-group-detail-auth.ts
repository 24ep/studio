import { NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import { auth } from '@/auth';
import { logAudit } from '@/lib/auditLog';
import { hasPermission, type SessionLikeUser } from '@/lib/permissions';

type UserGroupDetailSession = Session & {
  user: Session['user'] & SessionLikeUser & {
    id?: string;
    email?: string | null;
  };
};

export async function requireUserGroupSession(unauthorizedResponse: 'json' | 'text') {
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

export async function requireUserGroupPermission(
  session: UserGroupDetailSession,
  permission: 'USER_GROUPS_VIEW' | 'USER_GROUPS_EDIT' | 'USER_GROUPS_DELETE',
  auditAction: string,
  auditVerb: string,
  groupId: string
) {
  if (hasPermission(session.user, permission)) {
    return null;
  }

  await logAudit(
    'WARN',
    `Forbidden attempt to ${auditVerb} user group (ID: ${groupId}) by user ${session?.user?.email || 'Unknown'}.`,
    auditAction,
    session?.user?.id,
    { targetGroupId: groupId }
  );
  return NextResponse.json({ message: 'Forbidden: Insufficient permissions' }, { status: 403 });
}
