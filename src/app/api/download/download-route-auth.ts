import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { hasPermission, type SessionLikeUser } from '@/lib/permissions';

export type DownloadRouteUser = SessionLikeUser & {
  id: string;
};

export type DownloadRouteSession = {
  user: DownloadRouteUser;
};

function hasDownloadRouteUser(session: unknown): session is DownloadRouteSession {
  if (!session || typeof session !== 'object' || !('user' in session)) {
    return false;
  }

  const user = session.user;
  return Boolean(user && typeof user === 'object' && 'id' in user && typeof user.id === 'string');
}

export async function requireDownloadRouteSession() {
  const session = await auth();

  if (!hasDownloadRouteUser(session)) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }

  if (!hasPermission(session.user, 'applicantS_VIEW')) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: 'Forbidden: Insufficient permissions to download files' }, { status: 403 }),
    };
  }

  return { ok: true as const, session };
}
