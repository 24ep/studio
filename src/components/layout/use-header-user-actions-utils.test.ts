import { describe, expect, it } from 'vitest';
import {
  HEADER_PROFILE_UPDATE_FALLBACK_MESSAGE,
  buildHeaderUserSearchUrl,
  buildHeaderUserSummary,
  getHeaderCaughtErrorMessage,
  getHeaderImpersonationLoadingMessage,
  getHeaderProfileUpdateErrorMessage,
  normalizeHeaderPreviewUsers,
  shouldForceHeaderAvatarRefresh,
  shouldSearchHeaderUsers,
  shouldUpdateHeaderSessionUser,
} from './use-header-user-actions-utils';

describe('use-header-user-actions-utils', () => {
  it('builds header user summaries with safe fallbacks', () => {
    expect(buildHeaderUserSummary(null)).toBeNull();
    expect(buildHeaderUserSummary({
      id: 123,
      email: 'user@example.com',
      avatarUrl: '/avatar.png',
    })).toEqual({
      id: '123',
      name: 'user@example.com',
      email: 'user@example.com',
      role: 'Recruiter',
      avatarUrl: '/avatar.png',
      image: null,
      personalColor: null,
    });
  });

  it('detects profile changes that require session updates or avatar refresh', () => {
    const sessionUser = {
      name: 'Old',
      email: 'old@example.com',
      avatarUrl: '/old.png',
      personalColor: '#111',
    };

    expect(shouldUpdateHeaderSessionUser(sessionUser, {
      name: 'Old',
      email: 'old@example.com',
      avatarUrl: '/old.png',
      personalColor: '#111',
    })).toBe(false);
    expect(shouldUpdateHeaderSessionUser(sessionUser, { ...sessionUser, name: 'New' })).toBe(true);
    expect(shouldForceHeaderAvatarRefresh(sessionUser, { ...sessionUser, avatarUrl: '/new.png' })).toBe(true);
    expect(shouldForceHeaderAvatarRefresh(sessionUser, { ...sessionUser })).toBe(false);
  });

  it('builds and gates header user search requests', () => {
    expect(shouldSearchHeaderUsers('a')).toBe(false);
    expect(shouldSearchHeaderUsers('ab')).toBe(true);
    expect(buildHeaderUserSearchUrl('Jane Doe')).toBe('/api/users?search=Jane%20Doe&isActive=true&limit=5');
  });

  it('normalizes preview user API payloads', () => {
    const users = [{ id: '1', name: 'Jane', email: 'jane@example.com', role: 'Admin' }];

    expect(normalizeHeaderPreviewUsers({ users })).toEqual(users);
    expect(normalizeHeaderPreviewUsers({ users: null })).toEqual([]);
    expect(normalizeHeaderPreviewUsers(null)).toEqual([]);
  });

  it('extracts profile update error messages with fallback text', () => {
    expect(getHeaderProfileUpdateErrorMessage({ message: 'Email already exists' })).toBe('Email already exists');
    expect(getHeaderProfileUpdateErrorMessage({ error: 'ignored' })).toBe(HEADER_PROFILE_UPDATE_FALLBACK_MESSAGE);
    expect(getHeaderCaughtErrorMessage(new Error('Network failed'))).toBe('Network failed');
    expect(getHeaderCaughtErrorMessage('plain string')).toBe(HEADER_PROFILE_UPDATE_FALLBACK_MESSAGE);
  });

  it('builds impersonation loading messages', () => {
    expect(getHeaderImpersonationLoadingMessage('user-1', null)).toBe('Switching to user view...');
    expect(getHeaderImpersonationLoadingMessage(null, 'Admin')).toBe('Switching to Admin view...');
  });
});
