import { readJsonOrFallback } from '../lib/response-json';

export interface UserPresence {
  userId: string;
  userName: string;
  userRole: string;
  avatarUrl?: string | null;
  personalColor?: string | null;
  currentPage: string;
  lastSeen: string;
  isOnline: boolean;
}

interface PresenceSessionUser {
  id?: string | null;
  name?: string | null;
  email?: string | null;
  role?: string | null;
  avatarUrl?: string | null;
  personalColor?: string | null;
}

type UserPresenceFetcher = typeof fetch;

export function canSyncUserPresence(user?: PresenceSessionUser | null) {
  return Boolean(user?.id);
}

export async function updateCurrentUserPresence(
  user: PresenceSessionUser | null | undefined,
  pathname: string,
  fetcher: UserPresenceFetcher = fetch
) {
  if (!user?.id) {
    return false;
  }

  const response = await fetcher('/api/realtime/presence', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(buildUserPresencePayload(user, pathname)),
  });

  return response.ok;
}

export async function fetchOnlineUserPresence(
  userId: string | null | undefined,
  fetcher: UserPresenceFetcher = fetch
) {
  if (!userId) {
    return [];
  }

  const response = await fetcher('/api/realtime/presence');
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch presence data: ${response.status} ${errorText}`);
  }

  return parseUserPresenceList(await readJsonOrFallback<unknown>(response, {}));
}

export async function removeCurrentUserPresence(
  userId: string | null | undefined,
  fetcher: UserPresenceFetcher = fetch
) {
  if (!userId) {
    return false;
  }

  const response = await fetcher('/api/realtime/presence', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  });

  return response.ok;
}

function buildUserPresencePayload(user: PresenceSessionUser, pathname: string) {
  return {
    userId: user.id,
    userName: user.name || user.email || 'User',
    userRole: user.role || 'User',
    avatarUrl: user.avatarUrl,
    personalColor: user.personalColor,
    currentPage: pathname,
  };
}

function parseUserPresenceList(value: unknown): UserPresence[] {
  if (!isRecord(value) || !Array.isArray(value.users)) {
    return [];
  }

  return value.users.filter(isUserPresence);
}

function isUserPresence(value: unknown): value is UserPresence {
  return isRecord(value) &&
    typeof value.userId === 'string' &&
    typeof value.userName === 'string' &&
    typeof value.userRole === 'string' &&
    typeof value.currentPage === 'string' &&
    typeof value.lastSeen === 'string' &&
    typeof value.isOnline === 'boolean';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
