import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { hasPermission, type SessionLikeUser } from '@/lib/permissions';

export async function requireApplicantSourceDetailSession() {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      ok: false as const,
      response: NextResponse.json({ message: 'Unauthorized' }, { status: 401 }),
    };
  }

  return { ok: true as const, session };
}

export function requireApplicantSourceWritePermission(user: SessionLikeUser) {
  if (!hasPermission(user, 'SYSTEM_SETTINGS_EDIT')) {
    return NextResponse.json({ message: 'Forbidden: Insufficient permissions' }, { status: 403 });
  }

  return null;
}
