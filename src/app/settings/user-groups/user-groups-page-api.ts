import {
  getJsonErrorMessage,
  getJsonString,
  readJsonObject,
  readJsonOrFallback,
} from '../../../lib/response-json';
import type { UserGroup } from '@/lib/types';

import type { RoleFormValues } from './UserGroupsPageParts';
import {
  getRoleSaveRequest,
  normalizeUserGroupsListResponse,
  parseShowLogoOnlySetting,
} from './user-groups-page-utils';

export interface UserGroupsFetchResult {
  ok: boolean;
  status: number;
  roles: UserGroup[];
  message?: string;
}

export async function fetchUserGroupsList(): Promise<UserGroupsFetchResult> {
  const response = await fetch('/api/settings/user-groups');

  if (!response.ok) {
    const errorData = await readJsonOrFallback<{ message?: string }>(
      response,
      { message: 'Failed to fetch roles' },
    );

    return {
      ok: false,
      status: response.status,
      roles: [],
      message: errorData.message || 'Failed to fetch roles',
    };
  }

  return {
    ok: true,
    status: response.status,
    roles: normalizeUserGroupsListResponse(await readJsonOrFallback<unknown>(response, [])),
  };
}

export async function fetchShowLogoOnlySetting() {
  const response = await fetch('/api/settings/system-settings?keys=showLogoOnly');

  if (!response.ok) {
    return null;
  }

  return parseShowLogoOnlySetting(await readJsonObject(response));
}

export async function saveUserGroupRole(
  editingRole: UserGroup | null,
  data: RoleFormValues,
) {
  const saveRequest = getRoleSaveRequest(editingRole);
  const response = await fetch(saveRequest.url, {
    method: saveRequest.method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const result = await readJsonObject(response);

  if (!response.ok) {
    throw new Error(
      getJsonErrorMessage(
        result,
        `Failed to ${saveRequest.isEditing ? 'update' : 'create'} role`,
      ),
    );
  }

  return {
    isEditing: saveRequest.isEditing,
    name: getJsonString(result, 'name') || data.name,
  };
}

export async function deleteUserGroupRole(roleId: string) {
  const response = await fetch(`/api/settings/user-groups/${roleId}`, { method: 'DELETE' });

  if (!response.ok) {
    throw new Error(
      getJsonErrorMessage(await readJsonObject(response), 'Failed to delete role'),
    );
  }
}

export async function resetUserGroupRolePermissions(role: UserGroup) {
  const response = await fetch(`/api/settings/user-groups/${role.id}/reset-permissions`, {
    method: 'POST',
  });
  const result = await readJsonObject(response);

  if (!response.ok) {
    throw new Error(getJsonErrorMessage(result, 'Failed to reset role permissions'));
  }

  return getJsonString(result, 'message') ||
    `Permissions for "${role.name}" were reset to default.`;
}
