import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { hasPermission } from '@/lib/permissions';
import type { TaskboardUser } from './taskboard-applicants-types';

export async function requireTaskboardApplicantSession() {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      ok: false as const,
      response: NextResponse.json({ message: 'Unauthorized' }, { status: 401 }),
    };
  }

  if (!hasPermission(session.user, 'applicantS_VIEW')) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { message: 'Forbidden: Insufficient permissions to applicants view' },
        { status: 403 }
      ),
    };
  }

  return { ok: true as const, session: { user: session.user as TaskboardUser } };
}
