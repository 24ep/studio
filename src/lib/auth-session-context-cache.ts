import type { PlatformModuleId } from '@/lib/types';

export type UserFullContextReason = 'VALID' | 'NOT_FOUND' | 'EXPIRED' | 'INVALIDATED' | 'ERROR';

export type UserFullContextResult = {
  isValid: boolean;
  reason?: UserFullContextReason;
  userId?: string;
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
    image: string | null;
    avatarUrl: string | null;
    personalColor: string | null;
    isActive: boolean;
    twoFactorEnabled: boolean;
    twoFactorMethod: string | null;
    modulePermissions: PlatformModuleId[];
  };
};

const SESSION_CONTEXT_CACHE_TTL_MS = 5000;

const sessionContextCache = new Map<string, {
  expiresAt: number;
  value: UserFullContextResult;
}>();
const MAX_SESSION_CONTEXT_CACHE_ENTRIES = 2000;
const sessionContextCacheState = globalThis as unknown as {
  __sessionContextCleanupInterval?: NodeJS.Timeout;
};

function cleanupSessionContextCache() {
  const now = Date.now();

  for (const [sessionToken, cached] of sessionContextCache.entries()) {
    if (cached.expiresAt <= now) {
      sessionContextCache.delete(sessionToken);
    }
  }

  if (sessionContextCache.size > MAX_SESSION_CONTEXT_CACHE_ENTRIES) {
    const excess = sessionContextCache.size - MAX_SESSION_CONTEXT_CACHE_ENTRIES;
    const iterator = sessionContextCache.keys();
    for (let i = 0; i < excess; i += 1) {
      const key = iterator.next().value;
      if (!key) {
        break;
      }
      sessionContextCache.delete(key);
    }
  }
}

if (!sessionContextCacheState.__sessionContextCleanupInterval) {
  sessionContextCacheState.__sessionContextCleanupInterval = setInterval(cleanupSessionContextCache, 30_000);
  sessionContextCacheState.__sessionContextCleanupInterval.unref?.();
}

export function getCachedUserFullContext(sessionToken: string) {
  const cached = sessionContextCache.get(sessionToken);
  if (!cached || cached.expiresAt <= Date.now()) {
    sessionContextCache.delete(sessionToken);
    return null;
  }

  return cached.value;
}

export function setCachedUserFullContext(sessionToken: string, value: UserFullContextResult) {
  sessionContextCache.set(sessionToken, {
    expiresAt: Date.now() + SESSION_CONTEXT_CACHE_TTL_MS,
    value,
  });
}

export function deleteCachedUserFullContext(sessionToken: string) {
  sessionContextCache.delete(sessionToken);
}

export function clearUserFullContextCache(sessionToken?: string) {
  if (sessionToken) {
    deleteCachedUserFullContext(sessionToken);
    return;
  }

  sessionContextCache.clear();
}
