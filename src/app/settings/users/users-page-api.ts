import type { UnifiedUserFormValues } from '@/components/users/UnifiedUserModal';
import {
  getJsonNumber,
  getJsonString,
  isJsonObject,
  readJsonOrFallback,
} from '@/lib/response-json';
import type { UserProfile, UserTeam } from '@/lib/types';
import {
  buildUsersQueryParams,
  normalizeUserRoleOptions,
  normalizeUsersListResponse,
  type UsersPageFilters,
} from './users-page-utils';

function getJsonBoolean(value: Record<string, unknown>, key: string) {
  const field = value[key];
  return typeof field === 'boolean' ? field : undefined;
}

function normalizeUserTeamsResponse(value: unknown): UserTeam[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((team) => {
    if (!isJsonObject(team)) {
      return [];
    }

    const id = getJsonString(team, 'id');
    const name = getJsonString(team, 'name');
    if (!id || !name) {
      return [];
    }

    return [{
      id,
      name,
      description: getJsonString(team, 'description') ?? null,
      color: getJsonString(team, 'color'),
      isActive: getJsonBoolean(team, 'isActive') ?? true,
      member_count: getJsonNumber(team, 'member_count'),
      createdAt: getJsonString(team, 'createdAt'),
      updatedAt: getJsonString(team, 'updatedAt'),
    }];
  });
}

export async function fetchUsersPageList(
  filters: UsersPageFilters,
  options: { page: number; pageSize: number }
) {
  const queryParams = buildUsersQueryParams(filters, options);
  const response = await fetch(`/api/users?${queryParams.toString()}`);

  if (!response.ok) {
    const errorData = await readJsonOrFallback<{ message?: string }>(
      response,
      { message: response.statusText }
    );

    return {
      response,
      data: normalizeUsersListResponse(null),
      errorMessage: errorData.message || 'Failed to fetch users',
    };
  }

  return {
    response,
    data: normalizeUsersListResponse(await readJsonOrFallback<unknown>(response, {})),
    errorMessage: null,
  };
}

export async function fetchUsersPageFilterOptions(): Promise<{
  teams: UserTeam[];
  roles: Array<{ id: string; name: string }>;
}> {
  const [teamsResponse, rolesResponse] = await Promise.all([
    fetch('/api/settings/user-teams'),
    fetch('/api/settings/user-groups'),
  ]);

  return {
    teams: teamsResponse.ok
      ? normalizeUserTeamsResponse(await readJsonOrFallback<unknown>(teamsResponse, []))
      : [],
    roles: rolesResponse.ok
      ? normalizeUserRoleOptions(await readJsonOrFallback<unknown>(rolesResponse, []))
      : [],
  };
}

export async function createUsersPageUser(data: UnifiedUserFormValues) {
  const response = await fetch('/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await readJsonOrFallback<{ message?: string; errors?: Record<string, string[]> }>(
      response,
      { message: response.statusText }
    );
    const firstFieldError = errorData.errors
      ? Object.values(errorData.errors).flat().find(Boolean)
      : null;

    throw new Error(firstFieldError || errorData.message || 'Failed to add user');
  }
}

export async function updateUsersPageUser(userId: string, data: UnifiedUserFormValues) {
  const response = await fetch(`/api/users/${userId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Failed to update user');
  }

  return readJsonOrFallback<Partial<UserProfile>>(response, {});
}

export async function deleteUsersPageUser(userId: string) {
  const response = await fetch(`/api/users/${userId}`, { method: 'DELETE' });

  if (!response.ok) {
    throw new Error('Failed to delete user');
  }
}

export async function toggleUsersPageUserStatus(userId: string, isActive: boolean) {
  const response = await fetch(`/api/users/${userId}/toggle-status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ isActive }),
  });

  if (!response.ok) {
    throw new Error('Failed to update status');
  }
}

export async function sendUsersPageMfaSetupLink(userId: string) {
  const response = await fetch(`/api/users/${userId}/mfa-setup-link`, { method: 'POST' });
  const data = await readJsonOrFallback<{ message?: string }>(response, { message: response.statusText });
  if (!response.ok) {
    throw new Error(data.message || 'Failed to send MFA setup link');
  }
  return data.message || 'MFA setup link sent.';
}

export async function syncUsersPageFromActiveDirectory() {
  const response = await fetch('/api/users/sync-ad', { method: 'POST' });

  if (!response.ok) {
    throw new Error('Sync failed');
  }
}
