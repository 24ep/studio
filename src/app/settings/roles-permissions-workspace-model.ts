import type { PlatformModule, PlatformModuleId, UserGroup } from '@/lib/types';

export interface PermissionGroup {
  category: string;
  permissions: PlatformModule[];
  enabledCount: number;
}

export type PermissionAccessLevel = 'none' | 'view' | 'manage' | 'approve';

export interface PermissionFamily {
  key: string;
  label: string;
  description: string;
  modules: Partial<Record<Exclude<PermissionAccessLevel, 'none'>, PlatformModule>>;
  selectedLevel: PermissionAccessLevel;
  riskLevel: PlatformModule['riskLevel'];
}

export interface PermissionFamilyGroup {
  category: string;
  families: PermissionFamily[];
  grantedCount: number;
}

const ACCESS_LEVEL_ORDER: PermissionAccessLevel[] = ['none', 'view', 'manage', 'approve'];

function getPermissionLevel(permission: PlatformModule): Exclude<PermissionAccessLevel, 'none'> {
  const value = `${permission.id} ${permission.label}`.toUpperCase();
  if (/APPROV|RELEASE|AUTHORIZE|REVIEW/.test(value)) return 'approve';
  if (/MANAGE|CREATE|EDIT|DELETE|UPDATE|CONFIG|ADMIN|EXPORT|PUBLISH|TRIGGER|PROCESS|ASSIGN/.test(value)) return 'manage';
  return 'view';
}

function getPermissionFamilyKey(permission: PlatformModule) {
  return permission.id.replace(/_(VIEW|READ|ACCESS|LIST|MANAGE|CREATE|EDIT|DELETE|UPDATE|CONFIGURE|CONFIG|ADMIN|EXPORT|PUBLISH|TRIGGER|PROCESS|ASSIGN|APPROVE|RELEASE|AUTHORIZE|REVIEW)$/i, '');
}

function getPermissionFamilyLabel(permission: PlatformModule) {
  const stripped = permission.label.replace(/^(View|Read|Access|List|Manage|Create|Edit|Delete|Update|Configure|Administer|Export|Publish|Trigger|Process|Assign|Approve|Release|Authorize|Review)\s+/i, '');
  return stripped || permission.label;
}

export function buildPermissionFamilyGroups(
  modules: PlatformModule[],
  selected: PlatformModuleId[],
  search = '',
): PermissionFamilyGroup[] {
  const normalizedSearch = search.trim().toLowerCase();
  const selectedSet = new Set(selected);
  const categories = new Map<string, Map<string, PermissionFamily>>();

  modules.forEach(permission => {
    if (normalizedSearch && ![permission.label, permission.description, permission.category, permission.id]
      .some(value => value.toLowerCase().includes(normalizedSearch))) return;

    const familyKey = getPermissionFamilyKey(permission);
    const categoryFamilies = categories.get(permission.category) ?? new Map<string, PermissionFamily>();
    const family = categoryFamilies.get(familyKey) ?? {
      key: familyKey,
      label: getPermissionFamilyLabel(permission),
      description: permission.description,
      modules: {},
      selectedLevel: 'none' as PermissionAccessLevel,
      riskLevel: permission.riskLevel,
    };
    const level = getPermissionLevel(permission);
    family.modules[level] = permission;
    if (selectedSet.has(permission.id) && ACCESS_LEVEL_ORDER.indexOf(level) > ACCESS_LEVEL_ORDER.indexOf(family.selectedLevel)) {
      family.selectedLevel = level;
    }
    if (permission.riskLevel === 'CRITICAL' || (permission.riskLevel === 'HIGH' && family.riskLevel !== 'CRITICAL')) {
      family.riskLevel = permission.riskLevel;
    }
    categoryFamilies.set(familyKey, family);
    categories.set(permission.category, categoryFamilies);
  });

  const categoryPriority = [
    'HR Operations',
    'Applicant Management',
    'Position Management',
    'User Access Control',
    'Analytics & Reporting',
    'System Configuration',
    'Automation & Integration',
    'Logging & Audit',
  ];

  return Array.from(categories, ([category, families]) => {
    const familyList = Array.from(families.values());
    return {
      category,
      families: familyList,
      grantedCount: familyList.filter(family => family.selectedLevel !== 'none').length,
    };
  }).sort((left, right) => {
    const leftIndex = categoryPriority.indexOf(left.category);
    const rightIndex = categoryPriority.indexOf(right.category);
    return (leftIndex < 0 ? categoryPriority.length : leftIndex) - (rightIndex < 0 ? categoryPriority.length : rightIndex);
  });
}

export function setPermissionFamilyLevel(
  selected: PlatformModuleId[],
  family: PermissionFamily,
  level: PermissionAccessLevel,
) {
  const familyIds = Object.values(family.modules).map(permission => permission.id);
  const next = selected.filter(permissionId => !familyIds.includes(permissionId));
  if (level === 'none') return next;

  const targetIndex = ACCESS_LEVEL_ORDER.indexOf(level);
  (['view', 'manage', 'approve'] as const).forEach(candidate => {
    const permission = family.modules[candidate];
    if (permission && ACCESS_LEVEL_ORDER.indexOf(candidate) <= targetIndex) next.push(permission.id);
  });
  return Array.from(new Set(next));
}

export function buildPermissionGroups(
  modules: PlatformModule[],
  selected: PlatformModuleId[],
  search = '',
): PermissionGroup[] {
  const normalizedSearch = search.trim().toLowerCase();
  const selectedSet = new Set(selected);
  const groups = new Map<string, PlatformModule[]>();

  modules.forEach((permission) => {
    if (normalizedSearch && ![
      permission.label,
      permission.description,
      permission.category,
      permission.id,
    ].some(value => value.toLowerCase().includes(normalizedSearch))) return;

    groups.set(permission.category, [...(groups.get(permission.category) ?? []), permission]);
  });

  return Array.from(groups, ([category, permissions]) => ({
    category,
    permissions,
    enabledCount: permissions.filter(permission => selectedSet.has(permission.id)).length,
  }));
}

export function filterRoles(roles: UserGroup[], search: string) {
  const normalizedSearch = search.trim().toLowerCase();
  if (!normalizedSearch) return roles;

  return roles.filter(role => [role.name, role.description ?? '']
    .some(value => value.toLowerCase().includes(normalizedSearch)));
}

export function togglePermission(
  selected: PlatformModuleId[],
  permissionId: PlatformModuleId,
) {
  return selected.includes(permissionId)
    ? selected.filter(id => id !== permissionId)
    : [...selected, permissionId];
}

export function getPermissionRiskSummary(
  modules: PlatformModule[],
  selected: PlatformModuleId[],
) {
  const selectedSet = new Set(selected);
  const enabled = modules.filter(permission => selectedSet.has(permission.id));

  return {
    total: enabled.length,
    highRisk: enabled.filter(permission => permission.riskLevel === 'HIGH' || permission.riskLevel === 'CRITICAL').length,
    approvalRequired: enabled.filter(permission => permission.requiresApproval).length,
    categories: new Set(enabled.map(permission => permission.category)).size,
  };
}

export function havePermissionsChanged(
  saved: PlatformModuleId[],
  draft: PlatformModuleId[],
) {
  if (saved.length !== draft.length) return true;
  const savedSet = new Set(saved);
  return draft.some(permission => !savedSet.has(permission));
}
