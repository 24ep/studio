import type {
  PlatformModule,
  PlatformModuleCategory,
  PlatformModuleId,
} from "@/lib/types";
import type { PermissionGroup } from "./RolePermissionSelectorTypes";
import { errorRolePermission, warnRolePermission } from "./role-permission-selector-log-utils";
import { getValidPermissionModules } from "./role-permission-selector-validation-utils";

export function buildPermissionGroupsFromModules(
  categories: unknown,
  modules: unknown,
): PermissionGroup[] {
  try {
    const permissionCategories = getPermissionCategories(categories);
    if (permissionCategories.length === 0) {
      return [];
    }

    const validModules = getValidPermissionModules(modules);
    return permissionCategories.map((category) => ({
      category,
      permissions: validModules.filter((module) => module.category === category),
    }));
  } catch (error) {
    errorRolePermission("Error creating grouped permissions:", error);
    return [];
  }
}

export function filterPermissionGroups(
  groupedPermissions: PermissionGroup[],
  searchQuery: string,
): PermissionGroup[] {
  const query = searchQuery.toLowerCase();

  return groupedPermissions
    .map((group) => ({
      ...group,
      permissions: group.permissions.filter((permission) => matchesPermissionQuery(permission, query)),
    }))
    .filter((group) => group.permissions.length > 0);
}

export function getCategoryPermissionIds(
  modules: unknown,
  category: string,
): PlatformModuleId[] {
  return getValidPermissionModules(modules)
    .filter((module) => module.category === category)
    .map((module) => module.id as PlatformModuleId)
    .filter(Boolean);
}

function getPermissionCategories(categories: unknown) {
  if (!categories || typeof categories !== "object") {
    warnRolePermission("PLATFORM_MODULE_CATEGORIES is not available:", categories);
    return [];
  }

  return Object.values(categories as Record<string, PlatformModuleCategory>);
}

function matchesPermissionQuery(permission: PlatformModule, query: string) {
  if (!permission?.id) return false;
  return !query ||
    permission.label?.toLowerCase().includes(query) ||
    permission.id.toLowerCase().includes(query);
}
