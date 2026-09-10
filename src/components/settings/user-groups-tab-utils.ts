import { z } from 'zod';
import type { UserGroup } from '@/lib/types';

export const roleFormSchema = z.object({
  name: z.string().min(1, "Role name is required").max(100),
  description: z.string().optional().nullable(),
  permissions: z.array(z.string()).optional().default([]),
  is_default: z.boolean().optional().default(false),
});

export type RoleFormValues = z.infer<typeof roleFormSchema>;

export function buildRoleFormDefaults(role?: UserGroup | null): RoleFormValues {
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

export function hasDuplicateRoleName(
  roles: UserGroup[],
  name: string,
  editingRole?: UserGroup | null
) {
  if (editingRole) return false;

  return roles.some(role => role.name.toLowerCase() === name.toLowerCase());
}

export function getRoleSaveRequest(editingRole?: Pick<UserGroup, 'id'> | null) {
  const isEditing = Boolean(editingRole?.id);

  return {
    url: isEditing ? `/api/settings/user-groups/${editingRole?.id}` : '/api/settings/user-groups',
    method: isEditing ? 'PUT' : 'POST',
  };
}

export function getVisibleRoles(roles: UserGroup[]) {
  return roles.filter(role => role && role.id && role.name);
}

export function getRoleMemberCount(role: UserGroup) {
  const roleWithMemberCount = role as UserGroup & { memberCount?: number };
  return roleWithMemberCount.memberCount ?? role.user_count ?? 0;
}

export function normalizeSelectableRole(role: UserGroup): UserGroup | null {
  if (!role || !role.id || typeof role.id !== 'string' || !role.name || typeof role.name !== 'string') {
    return null;
  }

  return {
    ...role,
    permissions: Array.isArray(role.permissions) ? role.permissions : [],
  };
}
