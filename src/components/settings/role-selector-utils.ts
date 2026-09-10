import type { UserGroup } from '@/lib/types';

export const ROLE_SELECTOR_CATEGORY_ORDER = ['System Groups', 'Default Groups', 'Custom Groups'] as const;

export type RoleSelectorCategory = typeof ROLE_SELECTOR_CATEGORY_ORDER[number];

export const getRoleCategory = (role: UserGroup): RoleSelectorCategory => {
  if (role.isSystemRole) return 'System Groups';
  if (role.isDefault) return 'Default Groups';
  return 'Custom Groups';
};

export const filterRoleSelectorRoles = (roles: UserGroup[], query: string) => {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return roles;

  return roles.filter(role =>
    role.name.toLowerCase().includes(normalizedQuery) ||
    role.description?.toLowerCase().includes(normalizedQuery)
  );
};

export const groupRoleSelectorRoles = (roles: UserGroup[]) => (
  roles.reduce<Record<RoleSelectorCategory, UserGroup[]>>((groupedRoles, role) => {
    const category = getRoleCategory(role);
    groupedRoles[category].push(role);
    return groupedRoles;
  }, {
    'System Groups': [],
    'Default Groups': [],
    'Custom Groups': [],
  })
);

export const countSelectedRolesInGroup = (selectedRoleIds: string[], roles: UserGroup[]) => {
  const roleIds = new Set(roles.map(role => role.id));
  return selectedRoleIds.filter(roleId => roleIds.has(roleId)).length;
};

export const getRoleCategorySelectionLabel = ({
  multiple,
  roles,
  selectedRoleIds,
}: {
  multiple: boolean;
  roles: UserGroup[];
  selectedRoleIds: string[];
}) => {
  const selectedCount = countSelectedRolesInGroup(selectedRoleIds, roles);
  return multiple
    ? `${selectedCount}/${roles.length}`
    : `${selectedCount > 0 ? 1 : 0} selected`;
};

export const getSelectedRoleBadges = ({
  availableRoles,
  maxVisible = 5,
  selectedRoleIds,
}: {
  availableRoles: UserGroup[];
  maxVisible?: number;
  selectedRoleIds: string[];
}) => {
  const roleNameById = new Map(availableRoles.map(role => [role.id, role.name]));
  const visibleRoles = selectedRoleIds.slice(0, maxVisible).map(roleId => ({
    id: roleId,
    label: roleNameById.get(roleId) ?? roleId,
  }));

  return {
    hiddenCount: Math.max(selectedRoleIds.length - maxVisible, 0),
    visibleRoles,
  };
};
