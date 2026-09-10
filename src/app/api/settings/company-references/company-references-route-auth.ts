import { NextResponse } from 'next/server';

import { auth } from '@/auth';
import { hasPermission, type SessionLikeUser } from '@/lib/permissions';

export async function requireCompanyReferencesRouteSession() {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      ok: false as const,
      response: NextResponse.json({ message: 'Unauthorized' }, { status: 401 }),
    };
  }

  return {
    ok: true as const,
    session,
  };
}

export function requireCompanyReferencesViewPermission(user: SessionLikeUser) {
  const hasViewPermission = hasPermission(user, 'applicantS_VIEW') || user.role === 'Admin';

  if (!hasViewPermission) {
    return NextResponse.json(
      { message: 'Forbidden: Insufficient permissions to view company reference data' },
      { status: 403 },
    );
  }

  return null;
}

export function requireCompanyReferencesWritePermission(user: SessionLikeUser) {
  if (!hasPermission(user, 'SYSTEM_SETTINGS_EDIT') && user.role !== 'Admin') {
    return NextResponse.json({ message: 'Forbidden: Insufficient permissions' }, { status: 403 });
  }

  return null;
}
