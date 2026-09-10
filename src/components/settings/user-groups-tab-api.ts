import { getJsonErrorMessage, getJsonString, readJsonObject, readJsonOrFallback } from '@/lib/response-json';
import type { UserGroup } from '@/lib/types';
import {
  getRoleSaveRequest,
  type RoleFormValues,
} from './user-groups-tab-utils';

export async function fetchUserGroups() {
  const response = await fetch('/api/settings/user-groups');
  if (!response.ok) {
    const errorData = await readJsonOrFallback<{ message?: string }>(
      response,
      { message: 'Failed to fetch roles' },
    );

    if (response.status === 401) {
      return { status: 'unauthorized' as const };
    }

    if (response.status === 403) {
      throw new Error('No permission');
    }

    throw new Error(errorData.message);
  }

  return {
    data: await readJsonOrFallback<UserGroup[]>(response, []),
    status: 'success' as const,
  };
}

export async function saveUserGroupRole({
  data,
  editingRole,
}: {
  data: RoleFormValues;
  editingRole: UserGroup | null;
}) {
  const { method, url } = getRoleSaveRequest(editingRole);
  const response = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const result = await readJsonObject(response);

  if (!response.ok) {
    throw new Error(getJsonErrorMessage(result, `Failed to ${editingRole ? 'update' : 'create'} role`));
  }

  return { name: getJsonString(result, 'name') };
}

export async function deleteUserGroupRole(roleId: string) {
  const response = await fetch(`/api/settings/user-groups/${roleId}`, { method: 'DELETE' });

  if (!response.ok) {
    const errorData = await readJsonOrFallback<{ message?: string }>(
      response,
      { message: 'Failed to delete role' },
    );
    throw new Error(errorData.message);
  }
}
