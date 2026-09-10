import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { hasPermission } from '@/lib/permissions';
import { getSystemSetting } from '@/lib/systemSettings';

export async function authorizeInterviewInvitationRequest() {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      ok: false as const,
      response: NextResponse.json({ message: 'Unauthorized' }, { status: 401 }),
    };
  }

  const featureEnabled = await getSystemSetting('interviewInvitationFeatureEnabled');
  if (featureEnabled === 'false') {
    return {
      ok: false as const,
      response: NextResponse.json({ message: 'Interview invitation feature is disabled' }, { status: 403 }),
    };
  }

  if (!hasPermission(session.user, 'APPLICANTS_VIEW')) {
    return {
      ok: false as const,
      response: NextResponse.json({ message: 'Forbidden: Insufficient permissions' }, { status: 403 }),
    };
  }

  return { ok: true as const, session };
}
