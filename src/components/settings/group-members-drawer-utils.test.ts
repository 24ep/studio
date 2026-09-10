import { describe, expect, it } from 'vitest';

import {
  buildAvailableGroupUsersUrl,
  formatGroupMemberJoinedDate,
  getGroupMemberInitials,
  getGroupMembersErrorMessage,
  normalizeAvailableGroupUsersResponse,
} from './group-members-drawer-utils';

describe('group members drawer utilities', () => {
  it('builds initials from member names', () => {
    expect(getGroupMemberInitials('Jane Doe')).toBe('JD');
    expect(getGroupMemberInitials('Single')).toBe('S');
    expect(getGroupMemberInitials('Mary Jane Watson')).toBe('MJ');
  });

  it('formats joined dates with the runtime locale', () => {
    expect(formatGroupMemberJoinedDate('2026-01-02T00:00:00.000Z')).toBe(
      new Date('2026-01-02T00:00:00.000Z').toLocaleDateString()
    );
  });

  it('normalizes available user API responses', () => {
    const users = [{ id: 'user-1', name: 'Jane', email: 'jane@example.com', role: 'admin', createdAt: '2026-01-01' }];

    expect(normalizeAvailableGroupUsersResponse(users)).toEqual(users);
    expect(normalizeAvailableGroupUsersResponse({ users })).toEqual(users);
    expect(normalizeAvailableGroupUsersResponse({ users: null })).toEqual([]);
    expect(normalizeAvailableGroupUsersResponse(null)).toEqual([]);
  });

  it('builds available users URLs with optional search', () => {
    expect(buildAvailableGroupUsersUrl('https://example.com', '')).toBe('https://example.com/api/users');
    expect(buildAvailableGroupUsersUrl('https://example.com', 'Jane Doe')).toBe(
      'https://example.com/api/users?search=Jane+Doe'
    );
  });

  it('normalizes unknown errors to fallback messages', () => {
    expect(getGroupMembersErrorMessage(new Error('Bad request'), 'Fallback')).toBe('Bad request');
    expect(getGroupMembersErrorMessage('Bad request', 'Fallback')).toBe('Fallback');
  });
});
