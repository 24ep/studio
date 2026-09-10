import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { hasAnyPermission } from '@/lib/permissions';

export async function requireUploadQueueBulkActionSession() {
  const session = await auth();

  if (!session) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }

  if (!hasAnyPermission(session.user, ['UPLOAD_QUEUE_MANAGE'])) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: 'Forbidden: Insufficient permissions' }, { status: 403 }),
    };
  }

  return { ok: true as const, session };
}
