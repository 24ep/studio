import type { PlatformModuleId } from '@/lib/types';
import { readJsonOrFallback } from '../../lib/response-json';
import type { AvailableRoleUser, RoleFormValues } from './UnifiedRoleDrawerParts';
import type { UnifiedRoleMember } from './UnifiedRoleMembersTab';

type AvailableRoleUsersResponse = AvailableRoleUser[] | { users?: AvailableRoleUser[] };

export async function parseRoleDrawerResponse<T>(response: Response, fallbackMessage: string): Promise<T> {
  if (!response.ok) {
    const errorData = await readJsonOrFallback<{ message?: string }>(response, {
      message: fallbackMessage,
    });
    throw new Error(errorData.message || fallbackMessage);
  }

  return readJsonOrFallback<T>(response, {} as T);
}

export async function updateRolePermissions({
  roleId,
  permissions,
  signal,
}: {
  roleId: string;
  permissions: PlatformModuleId[];
  signal?: AbortSignal;
}) {
  const response = await fetch(`/api/settings/user-groups/${roleId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ permissions }),
    signal,
  });

  return parseRoleDrawerResponse<{ permissions?: PlatformModuleId[] }>(response, 'Failed to update permissions');
}

export async function loadRoleMembers(roleId: string, signal?: AbortSignal): Promise<UnifiedRoleMember[]> {
  const response = await fetch(`/api/settings/user-groups/${roleId}/members`, {
    signal,
  });

  const data = await parseRoleDrawerResponse<{ users?: UnifiedRoleMember[] }>(response, 'Failed to load group members');
  return data.users || [];
}

export async function loadAvailableRoleUsers(searchTerm: string, signal?: AbortSignal): Promise<AvailableRoleUser[]> {
  const query = searchTerm ? `?${new URLSearchParams({ search: searchTerm }).toString()}` : '';

  const response = await fetch(`/api/users${query}`, {
    signal,
  });

  const data = await parseRoleDrawerResponse<AvailableRoleUsersResponse>(response, 'Failed to load users');
  return Array.isArray(data) ? data : (data.users || []);
}

export async function updateRoleDetails({
  roleId,
  data,
  permissions,
}: {
  roleId: string;
  data: RoleFormValues;
  permissions: PlatformModuleId[];
}) {
  const response = await fetch(`/api/settings/user-groups/${roleId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...data,
      permissions,
    }),
  });

  return parseRoleDrawerResponse<{ name?: string }>(response, 'Failed to update role');
}

export async function addUserToRole(roleId: string, userId: string) {
  const response = await fetch(`/api/settings/user-groups/${roleId}/members`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  });

  await parseRoleDrawerResponse(response, 'Failed to add user to group');
}

export async function removeUserFromRole(roleId: string, userId: string) {
  const response = await fetch(`/api/settings/user-groups/${roleId}/members?userId=${userId}`, {
    method: 'DELETE',
  });

  await parseRoleDrawerResponse(response, 'Failed to remove user from group');
}
