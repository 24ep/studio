import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { validateUserSession } from '@/lib/auth';
import { logAudit } from '@/lib/auditLog';
import { hasAnyPermission } from '@/lib/permissions';

export async function requireUploadQueueSession() {
  const session = await auth();
  if (!session) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }

  const validation = await validateUserSession(session);
  if (!validation.isValid) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: validation.error }, { status: 401 }),
    };
  }

  return {
    ok: true as const,
    session,
    actingUserId: validation.userId!,
    actingUserName: validation.userName!,
  };
}

export async function requireUploadQueueManageSession() {
  const session = await auth();
  if (!session) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }

  if (!hasAnyPermission(session.user, ['UPLOAD_QUEUE_MANAGE'])) {
    await logAudit(
      'WARN',
      `Forbidden attempt to manage upload queue by ${session.user.name || session.user.email}.`,
      'API:UploadQueue:Manage',
      session.user.id
    );
    return {
      ok: false as const,
      response: NextResponse.json({ error: 'Forbidden: Insufficient permissions to manage upload queue' }, { status: 403 }),
    };
  }

  const validation = await validateUserSession(session);
  if (!validation.isValid) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: validation.error }, { status: 401 }),
    };
  }

  return {
    ok: true as const,
    session,
    actingUserId: validation.userId!,
    actingUserName: validation.userName!,
  };
}
