import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { hasAnyPermission, type SessionLikeUser } from '@/lib/permissions';

type UserPreferencesUser = SessionLikeUser & {
  id: string;
};

export async function requireUserPreferencesSession() {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }

  return { ok: true as const, session };
}

export function requireCanReadUserPreferences(user: UserPreferencesUser, targetUserId: string) {
  const isOwnPreferences = user.id === targetUserId;
  if (!hasAnyPermission(user, ['USERS_EDIT', 'USERS_VIEW']) && !isOwnPreferences) {
    return NextResponse.json(
      { error: 'Forbidden: Insufficient permissions or can only access own preferences' },
      { status: 403 }
    );
  }

  return null;
}

export function requireCanWriteUserPreferences(user: UserPreferencesUser, targetUserId: string) {
  const isOwnPreferences = user.id === targetUserId;
  if (!hasAnyPermission(user, ['USERS_EDIT']) && !isOwnPreferences) {
    return NextResponse.json(
      { error: 'Forbidden: Insufficient permissions or can only update own preferences' },
      { status: 403 }
    );
  }

  return null;
}
