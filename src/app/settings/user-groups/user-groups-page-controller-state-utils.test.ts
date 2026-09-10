import { describe, expect, it } from 'vitest';

import {
  getUserGroupsFetchFailureMessage,
  shouldShowUserGroupsErrorState,
  shouldShowUserGroupsInitialLoading,
} from './user-groups-page-controller-state-utils';

describe('user-groups-page-controller-state-utils', () => {
  it('maps fetch failures to user-facing messages', () => {
    expect(getUserGroupsFetchFailureMessage({
      ok: false,
      status: 403,
      roles: [],
      message: 'Forbidden',
    })).toBe('No permission');

    expect(getUserGroupsFetchFailureMessage({
      ok: false,
      status: 500,
      roles: [],
      message: 'Server down',
    })).toBe('Server down');
  });

  it('detects initial loading and visible error states', () => {
    expect(shouldShowUserGroupsInitialLoading({
      fetchError: null,
      isLoading: false,
      roles: [],
      selectedRole: null,
      sessionStatus: 'loading',
    })).toBe(true);

    expect(shouldShowUserGroupsInitialLoading({
      fetchError: null,
      isLoading: true,
      roles: [],
      selectedRole: null,
      sessionStatus: 'authenticated',
    })).toBe(true);

    expect(shouldShowUserGroupsInitialLoading({
      fetchError: 'No permission',
      isLoading: true,
      roles: [],
      selectedRole: null,
      sessionStatus: 'authenticated',
    })).toBe(false);

    expect(shouldShowUserGroupsErrorState('No permission', false)).toBe(true);
    expect(shouldShowUserGroupsErrorState('No permission', true)).toBe(false);
  });
});
