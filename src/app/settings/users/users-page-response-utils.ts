import { format, parseISO } from 'date-fns';

import type { UserProfile } from '@/lib/types';

import type { UsersListResponse } from './users-page-types';

interface UsersListPayload {
  users?: unknown;
  pagination?: {
    totalPages?: unknown;
    totalCount?: unknown;
  };
}

interface UserRoleOptionPayload {
  id: unknown;
  name: unknown;
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object');
}

function getUsersListPayload(data: unknown): UsersListPayload {
  return isObjectRecord(data) ? data as UsersListPayload : {};
}

function getNumberOrFallback(value: unknown, fallback: number) {
  return typeof value === 'number' ? value : fallback;
}

function isUserRoleOptionPayload(value: unknown): value is UserRoleOptionPayload {
  return isObjectRecord(value) && 'id' in value && 'name' in value;
}

function normalizeUserRoleOption(role: UserRoleOptionPayload) {
  return {
    id: String(role.id),
    name: String(role.name),
  };
}

function hasRoleOptionValues(role: { id: string; name: string }) {
  return Boolean(role.id && role.name);
}

export function normalizeUsersListResponse(data: unknown): UsersListResponse {
  if (Array.isArray(data)) {
    return {
      users: data as UserProfile[],
      totalPages: 1,
      totalCount: data.length,
    };
  }

  const response = getUsersListPayload(data);
  return {
    users: Array.isArray(response.users) ? response.users as UserProfile[] : [],
    totalPages: getNumberOrFallback(response.pagination?.totalPages, 1),
    totalCount: getNumberOrFallback(response.pagination?.totalCount, 0),
  };
}

export function getUserRoleBadgeLabel(user: Pick<UserProfile, 'role' | 'userGroupName'>) {
  return user.userGroupName || user.role;
}

export type UserAccountStatus = 'active' | 'invited' | 'disabled';

export function getUserAccountStatus(
  user: Pick<UserProfile, 'isActive' | 'lastLogin'>,
): UserAccountStatus {
  if (user.isActive === false) return 'disabled';
  return user.lastLogin ? 'active' : 'invited';
}

export function normalizeUserRoleOptions(data: unknown): Array<{ id: string; name: string }> {
  return Array.isArray(data)
    ? data
      .filter(isUserRoleOptionPayload)
      .map(normalizeUserRoleOption)
      .filter(hasRoleOptionValues)
    : [];
}

export function getUsersPageErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

export function formatUserLastLogin(lastLogin: string | null | undefined) {
  if (!lastLogin) return 'Never';

  try {
    return format(parseISO(lastLogin), 'MMM dd, yyyy');
  } catch {
    return 'Invalid date';
  }
}
