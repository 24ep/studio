import { describe, expect, it } from 'vitest';

import {
  buildCurrentUsersFilterPayload,
  buildUsersQueryParams,
  formatUserLastLogin,
  getUserAccountStatus,
  getUserPageFilterPayload,
  getUserRoleBadgeLabel,
  getUsersPageSelectionSummary,
  getUsersPageErrorMessage,
  normalizeUsersPageRoleFilter,
  normalizeUserRoleOptions,
  normalizeUsersListResponse,
  selectUsersOnPage,
  toggleUserSelection,
  updateUserInUsersList,
  updateUserStatusInUsersList,
} from './users-page-utils';

describe('users page utilities', () => {
  it('builds users query params while omitting sentinel filter values', () => {
    expect(buildUsersQueryParams({
      name: 'Ada',
      email: 'ada@example.com',
      role: 'ALL_ROLES',
      teamId: 'ALL_TEAMS',
    }, {
      page: 2,
      pageSize: 25,
    }).toString()).toBe('name=Ada&email=ada%40example.com&page=2&pageSize=25');

    expect(buildUsersQueryParams({
      role: 'Admin',
      teamId: 'team-1',
    }, {
      idsOnly: true,
    }).toString()).toBe('role=Admin&teamId=team-1&idsOnly=true');
  });

  it('normalizes legacy array and paginated users responses', () => {
    expect(normalizeUsersListResponse([{ id: 'user-1' }])).toEqual({
      users: [{ id: 'user-1' }],
      totalPages: 1,
      totalCount: 1,
    });

    expect(normalizeUsersListResponse({
      users: [{ id: 'user-2' }],
      pagination: { totalPages: 4, totalCount: 31 },
    })).toEqual({
      users: [{ id: 'user-2' }],
      totalPages: 4,
      totalCount: 31,
    });

    expect(normalizeUsersListResponse(null)).toEqual({
      users: [],
      totalPages: 1,
      totalCount: 0,
    });
  });

  it('creates the current users filter payload', () => {
    expect(getUserPageFilterPayload({
      name: 'Ada',
      email: '',
      role: 'Recruiter',
      teamId: 'team-1',
    })).toEqual({
      name: 'Ada',
      email: '',
      role: 'Recruiter',
      teamId: 'team-1',
    });
  });

  it('creates users filter payloads from page state names', () => {
    expect(buildCurrentUsersFilterPayload({
      nameFilter: 'Grace',
      emailFilter: 'grace@example.com',
      roleFilter: 'ALL_ROLES',
      teamFilter: 'team-1',
    })).toEqual({
      name: 'Grace',
      email: 'grace@example.com',
      role: 'ALL_ROLES',
      teamId: 'team-1',
    });
  });

  it('normalizes user role options defensively', () => {
    expect(normalizeUserRoleOptions([
      { id: 'role-1', name: 'Admin', ignored: true },
      { id: 2, name: 'Recruiter' },
      { id: '', name: 'Missing id' },
      { id: 'missing-name' },
      null,
    ])).toEqual([
      { id: 'role-1', name: 'Admin' },
      { id: '2', name: 'Recruiter' },
    ]);

    expect(normalizeUserRoleOptions(null)).toEqual([]);
  });

  it('normalizes page role filters and display labels', () => {
    expect(normalizeUsersPageRoleFilter('Admin')).toBe('Admin');
    expect(normalizeUsersPageRoleFilter('not-a-role')).toBe('ALL_ROLES');
    expect(getUserRoleBadgeLabel({
      role: 'Recruiter',
      userGroupName: 'Talent Team',
    })).toBe('Talent Team');
    expect(getUserRoleBadgeLabel({
      role: 'Hiring Manager',
      userGroupName: null,
    })).toBe('Hiring Manager');
  });

  it('selects and deselects users on the current page immutably', () => {
    const original = new Set(['existing']);
    const selected = selectUsersOnPage(original, [{ id: 'user-1' }, { id: 'user-2' }], true);

    expect(Array.from(original)).toEqual(['existing']);
    expect(Array.from(selected.selectedUserIds)).toEqual(['existing', 'user-1', 'user-2']);
    expect(selected.selectionMode).toBe('page');

    const deselected = selectUsersOnPage(selected.selectedUserIds, [{ id: 'user-1' }, { id: 'user-2' }], false);
    expect(Array.from(deselected.selectedUserIds)).toEqual(['existing']);
    expect(deselected.selectionMode).toBe('page');

    const empty = selectUsersOnPage(new Set(['user-1']), [{ id: 'user-1' }], false);
    expect(Array.from(empty.selectedUserIds)).toEqual([]);
    expect(empty.selectionMode).toBe('none');
  });

  it('toggles a single selected user and summarizes page selection', () => {
    const selected = toggleUserSelection(new Set(['user-1']), 'user-2', true);
    expect(Array.from(selected.selectedUserIds)).toEqual(['user-1', 'user-2']);
    expect(selected.selectionMode).toBe('page');

    const deselected = toggleUserSelection(selected.selectedUserIds, 'user-1', false);
    expect(Array.from(deselected.selectedUserIds)).toEqual(['user-2']);
    expect(deselected.selectionMode).toBe('page');

    expect(getUsersPageSelectionSummary(
      [{ id: 'user-1' }, { id: 'user-2' }],
      new Set(['user-1'])
    )).toEqual({
      isAllSelectedOnPage: false,
      isSomeSelectedOnPage: true,
    });

    expect(getUsersPageSelectionSummary(
      [{ id: 'user-1' }, { id: 'user-2' }],
      new Set(['user-1', 'user-2'])
    )).toEqual({
      isAllSelectedOnPage: true,
      isSomeSelectedOnPage: false,
    });
  });

  it('formats last login dates defensively', () => {
    expect(formatUserLastLogin(null)).toBe('Never');
    expect(formatUserLastLogin('2024-03-05T12:00:00.000Z')).toBe('Mar 05, 2024');
    expect(formatUserLastLogin('not-a-date')).toBe('Invalid date');
  });

  it('keeps invited accounts pending until their first successful login', () => {
    expect(getUserAccountStatus({ isActive: true, lastLogin: null })).toBe('invited');
    expect(getUserAccountStatus({
      isActive: true,
      lastLogin: '2026-07-31T08:00:00.000Z',
    })).toBe('active');
    expect(getUserAccountStatus({
      isActive: false,
      lastLogin: '2026-07-31T08:00:00.000Z',
    })).toBe('disabled');
  });

  it('updates user rows and error messages without mutating source lists', () => {
    const users = [
      { id: 'user-1', name: 'Ada', email: 'ada@example.com', role: 'Admin' },
      { id: 'user-2', name: 'Grace', email: 'grace@example.com', role: 'Recruiter' },
    ] as Parameters<typeof updateUserInUsersList>[0];

    const updatedUsers = updateUserInUsersList(users, 'user-2', { name: 'Grace Hopper' });
    expect(updatedUsers[1].name).toBe('Grace Hopper');
    expect(users[1].name).toBe('Grace');

    expect(updateUserStatusInUsersList(users, 'user-1', false)[0].isActive).toBe(false);
    expect(getUsersPageErrorMessage(new Error('Nope'))).toBe('Nope');
    expect(getUsersPageErrorMessage('plain failure')).toBe('plain failure');
  });
});
