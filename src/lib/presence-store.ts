// Shared presence store for realtime presence management
export interface UserPresence {
  userId: string;
  userName: string;
  userRole: string;
  avatarUrl?: string | null;
  personalColor?: string | null;
  currentPage: string;
  lastSeen: Date;
  isOnline: boolean;
}

// In-memory storage for user presence (in production, use Redis)
const userPresenceStore = new Map<string, UserPresence>();

// Clean up offline users (older than 6 hours)
const OFFLINE_THRESHOLD = 6 * 60 * 60 * 1000; // 6 hours in milliseconds
const CLEANUP_INTERVAL = 60000;

function normalizeLastSeen(lastSeen: UserPresence['lastSeen']) {
  const lastSeenDate = lastSeen instanceof Date ? lastSeen : new Date(lastSeen);
  return Number.isNaN(lastSeenDate.getTime()) ? null : lastSeenDate;
}

function isExpiredPresence(presence: UserPresence, now: Date) {
  const lastSeenDate = normalizeLastSeen(presence.lastSeen);
  if (!lastSeenDate) {
    return true;
  }

  return now.getTime() - lastSeenDate.getTime() > OFFLINE_THRESHOLD;
}

function isValidPresence(presence: UserPresence | undefined) {
  return Boolean(presence?.userId && presence.userName);
}

function isSettablePresence(userId: string, presence: UserPresence | undefined) {
  return Boolean(userId && presence?.userName && presence.userRole);
}

function updatePresence(userId: string, update: (presence: UserPresence) => UserPresence) {
  if (!userId) {
    return;
  }

  const existingPresence = userPresenceStore.get(userId);
  if (existingPresence) {
    userPresenceStore.set(userId, update(existingPresence));
  }
}

function getPresenceValues() {
  return Array.from(userPresenceStore.values()).filter(isValidPresence);
}

export function cleanupOfflineUsers() {
  const now = new Date();
  for (const [userId, presence] of userPresenceStore.entries()) {
    if (!isValidPresence(presence) || isExpiredPresence(presence, now)) {
      userPresenceStore.delete(userId);
    }
  }
}

// Clean up offline users periodically (guard against dev hot-reloads)
const __presenceGlobal = globalThis as unknown as { __presenceCleanupInterval?: NodeJS.Timeout };
if (!__presenceGlobal.__presenceCleanupInterval) {
  // Start periodic cleanup of offline users - reduced frequency for lower CPU usage
  __presenceGlobal.__presenceCleanupInterval = setInterval(cleanupOfflineUsers, CLEANUP_INTERVAL); // Optimized: 60s (was 10s)
  __presenceGlobal.__presenceCleanupInterval.unref?.();
}

// Presence store functions
export function setUserPresence(userId: string, presence: UserPresence) {
  if (!isSettablePresence(userId, presence)) {
    return;
  }

  userPresenceStore.set(userId, presence);
}

export function getUserPresence(userId: string): UserPresence | undefined {
  if (!userId) {
    return undefined;
  }

  return userPresenceStore.get(userId);
}

export function getAllUserPresence(): UserPresence[] {
  return getPresenceValues();
}

export function removeUserPresence(userId: string) {
  if (!userId) {
    return;
  }

  userPresenceStore.delete(userId);
}

export function markUserOffline(userId: string) {
  updatePresence(userId, presence => ({
    ...presence,
    isOnline: false,
    lastSeen: new Date(),
  }));
}

export function updateUserPage(userId: string, currentPage: string) {
  if (!currentPage) {
    return;
  }

  updatePresence(userId, presence => ({
    ...presence,
    currentPage,
    lastSeen: new Date(),
  }));
}

// Get store statistics for debugging
export function getPresenceStoreStats() {
  const totalUsers = userPresenceStore.size;
  const onlineUsers = getPresenceValues().filter(presence => presence.isOnline).length;

  return {
    totalUsers,
    onlineUsers,
    offlineUsers: totalUsers - onlineUsers,
    storeSize: userPresenceStore.size,
  };
}
