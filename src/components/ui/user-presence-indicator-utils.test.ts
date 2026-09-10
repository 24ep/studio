import { describe, expect, it } from 'vitest';

import type { UserPresence } from '@/hooks/use-user-presence';

import {
  buildPresenceUsersKey,
  getOnlinePresenceUsers,
  getPresenceUserInitials,
  getRemainingPresenceCount,
  getVisiblePresenceUsers,
} from './user-presence-indicator-utils';

const users: UserPresence[] = [
  { userId: '1', userName: 'Ada Lovelace', userRole: 'Admin', currentPage: '/', lastSeen: '', isOnline: true },
  { userId: '2', userName: 'Grace Hopper', userRole: 'User', currentPage: '/', lastSeen: '', isOnline: false },
  { userId: '3', userName: 'Katherine Johnson', userRole: 'User', currentPage: '/', lastSeen: '', isOnline: true },
];

describe('user-presence-indicator-utils', () => {
  it('selects visible online users and remaining counts', () => {
    expect(getOnlinePresenceUsers(users).map(user => user.userId)).toEqual(['1', '3']);
    expect(getVisiblePresenceUsers(users, 1).map(user => user.userId)).toEqual(['1']);
    expect(getRemainingPresenceCount(users, 1)).toBe(1);
    expect(getRemainingPresenceCount(users, 3)).toBe(0);
  });

  it('builds stable keys and initials', () => {
    expect(buildPresenceUsersKey(getOnlinePresenceUsers(users))).toBe('1-true,3-true');
    expect(getPresenceUserInitials(' Ada  Lovelace ')).toBe('AL');
  });
});
