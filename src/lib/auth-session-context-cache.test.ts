import { describe, expect, it } from 'vitest';
import {
  clearUserFullContextCache,
  deleteCachedUserFullContext,
  getCachedUserFullContext,
  setCachedUserFullContext,
  type UserFullContextResult,
} from './auth-session-context-cache';

const context: UserFullContextResult = {
  isValid: true,
  reason: 'VALID',
  userId: 'user-1',
  user: {
    id: 'user-1',
    name: 'Test User',
    email: 'test@example.com',
    role: 'Recruiter',
    image: null,
    avatarUrl: null,
    personalColor: null,
    isActive: true,
    twoFactorEnabled: false,
    twoFactorMethod: null,
    modulePermissions: [],
  },
};

describe('auth-session-context-cache', () => {
  it('stores and clears cached session context by token', () => {
    setCachedUserFullContext('token-a', context);

    expect(getCachedUserFullContext('token-a')).toEqual(context);

    clearUserFullContextCache('token-a');

    expect(getCachedUserFullContext('token-a')).toBeNull();
  });

  it('can delete one cached token without clearing all entries', () => {
    setCachedUserFullContext('token-a', context);
    setCachedUserFullContext('token-b', { ...context, userId: 'user-2' });

    deleteCachedUserFullContext('token-a');

    expect(getCachedUserFullContext('token-a')).toBeNull();
    expect(getCachedUserFullContext('token-b')?.userId).toBe('user-2');

    clearUserFullContextCache();
  });
});
