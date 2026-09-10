import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { hasAnyPermission } from '@/lib/permissions';
import type { Session } from 'next-auth';

type UploadQueuePermissionSession = {
  user: Session['user'];
};

export async function requireUploadQueueItemSession() {
  const session = await auth();

  if (!session) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }

  return { ok: true as const, session };
}

export function requireUploadQueueManagePermission(session: UploadQueuePermissionSession) {
  if (hasAnyPermission(session.user, ['UPLOAD_QUEUE_MANAGE'])) {
    return null;
  }

  return NextResponse.json({ error: 'Forbidden: Insufficient permissions' }, { status: 403 });
}
