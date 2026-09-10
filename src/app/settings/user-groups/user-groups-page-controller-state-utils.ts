import type { UserGroup } from '@/lib/types';

import type { UserGroupsFetchResult } from './user-groups-page-api';

export function getUserGroupsCurrentPath() {
  return typeof window !== 'undefined'
    ? window.location.pathname
    : '/settings/user-groups';
}

export function getUserGroupsFetchFailureMessage(result: UserGroupsFetchResult) {
  if (result.status === 403) {
    return 'No permission';
  }

  return result.message;
}

export function shouldShowUserGroupsInitialLoading({
  fetchError,
  isLoading,
  roles,
  selectedRole,
  sessionStatus,
}: {
  fetchError: string | null;
  isLoading: boolean;
  roles: UserGroup[];
  selectedRole: UserGroup | null;
  sessionStatus: string;
}) {
  return sessionStatus === 'loading' ||
    (isLoading && !fetchError && roles.length === 0 && !selectedRole);
}

export function shouldShowUserGroupsErrorState(fetchError: string | null, isLoading: boolean) {
  return Boolean(fetchError && !isLoading);
}
