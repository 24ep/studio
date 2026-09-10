import type { UserPresence } from '@/lib/presence-store';

interface PresenceSessionUser {
  avatarUrl?: string | null;
  personalColor?: string | null;
  role?: string | null;
}

export function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

export function getStringField(body: Record<string, unknown>, field: string): string | undefined {
  const value = body[field];
  return typeof value === 'string' ? value : undefined;
}

export function createPresenceFromBody(
  body: Record<string, unknown>,
  user: PresenceSessionUser
): { ok: true; presence: UserPresence } | { ok: false; error: string } {
  const userId = getStringField(body, 'userId');
  const userName = getStringField(body, 'userName');

  if (!userId || !userName) {
    return { ok: false, error: 'Missing required fields' };
  }

  return {
    ok: true,
    presence: {
      userId,
      userName,
      userRole: getStringField(body, 'userRole') || user.role || 'User',
      avatarUrl: getStringField(body, 'avatarUrl') || user.avatarUrl || null,
      personalColor: getStringField(body, 'personalColor') || user.personalColor || null,
      currentPage: getStringField(body, 'currentPage') || '/',
      lastSeen: new Date(),
      isOnline: true,
    },
  };
}

export function serializePresenceUsers(presences: UserPresence[]) {
  return presences.map((presence) => ({
    userId: presence.userId,
    userName: presence.userName,
    userRole: presence.userRole,
    avatarUrl: presence.avatarUrl,
    personalColor: presence.personalColor,
    currentPage: presence.currentPage,
    lastSeen: presence.lastSeen.toISOString(),
    isOnline: presence.isOnline,
  }));
}
