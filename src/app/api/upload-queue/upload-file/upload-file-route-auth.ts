import { NextResponse } from 'next/server';

import { auth } from '@/auth';
import { validateUserSession } from '@/lib/auth';
import { hasAnyPermission } from '@/lib/permissions';
import { getPool } from '@/lib/db';

export async function authorizeUploadRequest(sourceId?: string) {
  const session = await auth();
  if (!session) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }

  const validation = await validateUserSession(session);
  if (!validation.isValid) {
    console.error(`Upload attempt with invalid session by ${validation.userName || 'Unknown'}`, {
      invalidUserId: validation.userId,
      sessionUser: validation.userName,
      error: validation.error,
    });
    return {
      ok: false as const,
      response: NextResponse.json({ error: validation.error }, { status: 401 }),
    };
  }

  const canManageUploads = hasAnyPermission(session.user, ['BULK_UPLOAD_EXECUTE', 'UPLOAD_QUEUE_MANAGE']);
  let isEmployeeReferral = false;
  if (!canManageUploads && hasAnyPermission(session.user, ['FRIEND_REFERRALS_ACCESS']) && sourceId) {
    const source = await getPool().query<{ name: string }>(
      'SELECT name FROM "ApplicantSource" WHERE id = $1 AND is_active = true',
      [sourceId],
    );
    isEmployeeReferral = source.rows[0]?.name === 'Employee Referral';
  }

  if (!canManageUploads && !isEmployeeReferral) {
    console.warn(`Forbidden upload attempt by ${validation.userName}`);
    return {
      ok: false as const,
      response: NextResponse.json({ error: 'Forbidden: Insufficient permissions to upload files' }, { status: 403 }),
    };
  }

  return {
    ok: true as const,
    actingUserId: validation.userId!,
    actingUserName: validation.userName!,
  };
}
