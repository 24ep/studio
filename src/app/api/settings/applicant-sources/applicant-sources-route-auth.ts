import { NextResponse } from 'next/server';

import { auth } from '@/auth';
import { hasPermission, type SessionLikeUser } from '@/lib/permissions';

export async function requireApplicantSourcesRouteSession() {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      ok: false as const,
      response: NextResponse.json({ message: "Unauthorized" }, { status: 401 }),
    };
  }

  return {
    ok: true as const,
    session,
  };
}

export function requireApplicantSourcesViewPermission(user: SessionLikeUser) {
  const hasViewPermission = hasPermission(user, 'applicantS_VIEW')
    || hasPermission(user, 'FRIEND_REFERRALS_ACCESS')
    || user.role === 'Admin';

  if (!hasViewPermission) {
    console.warn('Permission denied - missing applicantS_VIEW permission');
    return NextResponse.json({ message: "Forbidden: Insufficient permissions to view Applicant sources" }, { status: 403 });
  }

  return null;
}

export function requireApplicantSourcesWritePermission(user: SessionLikeUser) {
  if (!hasPermission(user, 'SYSTEM_SETTINGS_EDIT') && user.role !== 'Admin') {
    return NextResponse.json({ message: "Forbidden: Insufficient permissions" }, { status: 403 });
  }

  return null;
}
