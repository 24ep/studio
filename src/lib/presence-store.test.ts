import { afterEach, describe, expect, it } from 'vitest';

import {
  cleanupOfflineUsers,
  getAllUserPresence,
  getPresenceStoreStats,
  getUserPresence,
  markUserOffline,
  removeUserPresence,
  setUserPresence,
  updateUserPage,
  type UserPresence,
} from './presence-store';

const testUserIds = ['presence-test-active', 'presence-test-stale', 'presence-test-invalid'];

function makePresence(overrides: Partial<UserPresence> = {}): UserPresence {
  return {
    userId: overrides.userId ?? 'presence-test-active',
    userName: overrides.userName ?? 'Ada',
    userRole: overrides.userRole ?? 'Recruiter',
    currentPage: overrides.currentPage ?? '/applicants',
    lastSeen: overrides.lastSeen ?? new Date(),
    isOnline: overrides.isOnline ?? true,
    avatarUrl: overrides.avatarUrl,
    personalColor: overrides.personalColor,
  };
}

afterEach(() => {
  testUserIds.forEach(removeUserPresence);
});

describe('presence store', () => {
  it('sets, updates, and marks user presence offline', () => {
    setUserPresence('presence-test-active', makePresence());

    expect(getUserPresence('presence-test-active')).toMatchObject({
      userName: 'Ada',
      currentPage: '/applicants',
      isOnline: true,
    });

    updateUserPage('presence-test-active', '/dashboard');
    expect(getUserPresence('presence-test-active')).toMatchObject({
      currentPage: '/dashboard',
      isOnline: true,
    });

    markUserOffline('presence-test-active');
    expect(getUserPresence('presence-test-active')).toMatchObject({
      currentPage: '/dashboard',
      isOnline: false,
    });
  });

  it('ignores invalid presence rows and cleans stale users', () => {
    setUserPresence('presence-test-active', makePresence());
    setUserPresence('presence-test-stale', makePresence({
      userId: 'presence-test-stale',
      lastSeen: new Date(Date.now() - 7 * 60 * 60 * 1000),
    }));
    setUserPresence('presence-test-invalid', makePresence({
      userId: 'presence-test-invalid',
      userName: '',
    }));

    cleanupOfflineUsers();

    expect(getUserPresence('presence-test-active')).toBeDefined();
    expect(getUserPresence('presence-test-stale')).toBeUndefined();
    expect(getUserPresence('presence-test-invalid')).toBeUndefined();
    expect(getAllUserPresence().some(presence => presence.userId === 'presence-test-active')).toBe(true);
  });

  it('reports store stats from valid presence rows', () => {
    setUserPresence('presence-test-active', makePresence());
    setUserPresence('presence-test-stale', makePresence({
      userId: 'presence-test-stale',
      isOnline: false,
    }));

    expect(getPresenceStoreStats()).toMatchObject({
      onlineUsers: 1,
      offlineUsers: 1,
    });
  });
});
