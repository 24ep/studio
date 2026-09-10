import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { hasPermission } from '@/lib/permissions';
import type { Session } from 'next-auth';

export async function requireUserTeamSession() {
  const session = await auth();
  const actingUserId = session?.user?.id;

  if (!actingUserId) {
    return {
      ok: false as const,
      response: new NextResponse('Unauthorized', { status: 401 }),
    };
  }

  return { ok: true as const, session, actingUserId };
}

export function requireUserTeamPermission(session: Session, permission: 'USERS_VIEW' | 'USERS_EDIT' | 'USERS_DELETE') {
  return hasPermission(session.user, permission)
    ? null
    : new NextResponse('Forbidden: Insufficient permissions', { status: 403 });
}
