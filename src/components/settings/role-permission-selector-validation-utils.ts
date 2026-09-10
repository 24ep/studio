import type {
  PlatformModule,
  PlatformModuleId,
} from "@/lib/types";
import { warnRolePermission } from "./role-permission-selector-log-utils";

export function normalizePermissionIds(
  value: unknown,
  label: string,
): PlatformModuleId[] {
  if (!Array.isArray(value)) {
    warnRolePermission(`${label} is not an array:`, value);
    return [];
  }

  return value.filter((permissionId): permissionId is PlatformModuleId =>
    isValidPermissionId(permissionId, label),
  );
}

export function getValidPermissionModules(modules: unknown): PlatformModule[] {
  if (!Array.isArray(modules)) {
    warnRolePermission("PLATFORM_MODULES is not an array:", modules);
    return [];
  }

  return modules.filter(isValidPermissionModule);
}

function isValidPermissionId(permissionId: unknown, label: string): permissionId is PlatformModuleId {
  if (typeof permissionId !== "string") {
    warnRolePermission(`Invalid ${label} permission ID type:`, typeof permissionId, permissionId);
    return false;
  }

  if (permissionId.length === 0) {
    warnRolePermission(`Empty ${label} permission ID found`);
    return false;
  }

  return true;
}

function isValidPermissionModule(module: unknown): module is PlatformModule {
  return Boolean(
    module &&
    typeof module === "object" &&
    "id" in module &&
    "category" in module &&
    module.id &&
    module.category,
  );
}
