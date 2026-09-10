import type { UserGroup } from '@/lib/types';
import {
  getJsonArray,
  getJsonNumber,
  getJsonString,
  isJsonObject,
} from '../../../lib/response-json';

const USER_GROUP_UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface RoleFormDefaults {
  name: string;
  description: string;
  permissions: string[];
  is_default: boolean;
}

export type SelectableRoleValidationResult =
  | { valid: true }
  | { valid: false; logMessage: string; userMessage: string };

export function canViewUserGroups(user?: {
  modulePermissions?: string[] | null;
  role?: string | null;
} | null) {
  return user?.role === 'Admin' ||
    user?.modulePermissions?.includes('USER_GROUPS_VIEW') === true;
}

export function buildRoleFormDefaults(role?: UserGroup | null): RoleFormDefaults {
  return role
    ? {
        name: role.name,
        description: role.description || '',
        permissions: role.permissions || [],
        is_default: role.isDefault || false,
      }
    : {
        name: '',
        description: '',
        permissions: [],
        is_default: false,
      };
}

export function getRoleSaveRequest(editingRole?: Pick<UserGroup, 'id'> | null) {
  const isEditing = Boolean(editingRole?.id);

  return {
    isEditing,
    url: isEditing ? `/api/settings/user-groups/${editingRole?.id}` : '/api/settings/user-groups',
    method: isEditing ? 'PUT' : 'POST',
  };
}

export function validateSelectableRole(role: Pick<UserGroup, 'id'>): SelectableRoleValidationResult {
  if (!role.id || typeof role.id !== 'string') {
    return {
      valid: false,
      logMessage: 'handleSelectRole: Invalid role ID:',
      userMessage: 'Invalid role data. Please refresh the page.',
    };
  }

  if (!USER_GROUP_UUID_PATTERN.test(role.id)) {
    return {
      valid: false,
      logMessage: 'handleSelectRole: Role ID is not a valid UUID:',
      userMessage: 'Invalid role ID format. Please refresh the page.',
    };
  }

  return { valid: true };
}

export function syncSelectedRoleAfterRoleListUpdate(
  roles: UserGroup[],
  previousSelectedRole: UserGroup | null
) {
  if (!previousSelectedRole) return null;
  return roles.find(role => role.id === previousSelectedRole.id) || previousSelectedRole;
}

export function normalizeUserGroupsListResponse(data: unknown): UserGroup[] {
  if (!Array.isArray(data)) {
    return [];
  }

  return data.flatMap((role) => {
    if (!isJsonObject(role)) {
      return [];
    }

    const id = getJsonString(role, 'id');
    const name = getJsonString(role, 'name');
    if (!id || !name) {
      return [];
    }

    const normalizedRole: UserGroup = {
      id,
      name,
    };
    const description = getJsonString(role, 'description');
    const permissions = getJsonArray(role, 'permissions')?.filter((permission): permission is string => (
      typeof permission === 'string'
    )) as UserGroup['permissions'];
    const isDefault = getJsonBoolean(role, 'isDefault');
    const isSystemRole = getJsonBoolean(role, 'isSystemRole');
    const userCount = getJsonNumber(role, 'user_count');
    const createdAt = getJsonString(role, 'createdAt');
    const updatedAt = getJsonString(role, 'updatedAt');

    if (description !== undefined) normalizedRole.description = description;
    if (permissions !== undefined) normalizedRole.permissions = permissions;
    if (isDefault !== undefined) normalizedRole.isDefault = isDefault;
    if (isSystemRole !== undefined) normalizedRole.isSystemRole = isSystemRole;
    if (userCount !== undefined) normalizedRole.user_count = userCount;
    if (createdAt !== undefined) normalizedRole.createdAt = createdAt;
    if (updatedAt !== undefined) normalizedRole.updatedAt = updatedAt;

    return [normalizedRole];
  });
}

export function parseShowLogoOnlySetting(data: unknown) {
  if (!isJsonObject(data)) return false;
  const value = data.showLogoOnly;
  return value === true || value === 'true';
}

function getJsonBoolean(value: Record<string, unknown>, key: string) {
  const field = value[key];
  return typeof field === 'boolean' ? field : undefined;
}
