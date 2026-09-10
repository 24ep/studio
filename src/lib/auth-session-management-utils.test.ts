import { describe, expect, it } from 'vitest';
import {
  buildUserFullContextResult,
  buildValidSessionResult,
  getFullContextInvalidResult,
  getSessionInvalidResult,
  shouldUpdateSessionActivity,
} from './auth-session-management-utils';

describe('auth session management utils', () => {
  const now = new Date('2026-01-02T00:00:00.000Z');

  it('classifies invalidated and expired sessions', () => {
    expect(getSessionInvalidResult({
      user_id: 'user-1',
      is_active: false,
      expires_at: '2026-01-03T00:00:00.000Z',
    }, now)).toEqual({ isValid: false, reason: 'INVALIDATED', userId: 'user-1' });

    expect(getSessionInvalidResult({
      user_id: 'user-1',
      is_active: true,
      expires_at: '2026-01-01T00:00:00.000Z',
    }, now)).toEqual({ isValid: false, reason: 'EXPIRED', userId: 'user-1' });
  });

  it('builds valid session results', () => {
    expect(buildValidSessionResult({
      id: 'session-1',
      user_id: 'user-1',
      is_active: true,
      expires_at: '2026-01-03T00:00:00.000Z',
    })).toMatchObject({
      isValid: true,
      userId: 'user-1',
      sessionId: 'session-1',
      reason: 'VALID',
    });
  });

  it('decides when activity should be refreshed', () => {
    expect(shouldUpdateSessionActivity(null, now)).toBe(true);
    expect(shouldUpdateSessionActivity('2026-01-01T23:58:59.000Z', now)).toBe(true);
    expect(shouldUpdateSessionActivity('2026-01-01T23:59:30.000Z', now)).toBe(false);
  });

  it('builds full context responses with avatar fallback', () => {
    const result = buildUserFullContextResult({
      session_id: 'session-1',
      user_id: 'user-1',
      session_active: true,
      expires_at: '2026-01-03T00:00:00.000Z',
      name: 'Ada',
      email: 'ada@example.com',
      role: 'Admin',
      image: 'image.png',
      avatarUrl: null,
      personal_color: '#123456',
      user_active: true,
      two_factor_enabled: false,
      two_factor_method: null,
      permissions: ['applicantS_VIEW'],
    });

    expect(result.user?.avatarUrl).toBe('image.png');
    expect(result.user?.modulePermissions).toContain('APPLICANTS_VIEW');
  });

  it('classifies invalid full-context rows', () => {
    expect(getFullContextInvalidResult({
      user_id: 'user-1',
      session_active: false,
      expires_at: '2026-01-03T00:00:00.000Z',
    }, now)).toEqual({ isValid: false, reason: 'INVALIDATED', userId: 'user-1' });
  });
});
