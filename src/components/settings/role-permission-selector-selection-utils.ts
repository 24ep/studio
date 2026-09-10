import type { PlatformModuleId } from "@/lib/types";

export function selectCategoryPermissionIds(
  selectedPermissions: PlatformModuleId[],
  categoryPermissions: PlatformModuleId[],
): PlatformModuleId[] {
  const categoryPermissionSet = new Set(categoryPermissions);
  const otherPermissions = selectedPermissions.filter((permissionId) => !categoryPermissionSet.has(permissionId));
  return [...otherPermissions, ...categoryPermissions];
}

export function clearCategoryPermissionIds(
  selectedPermissions: PlatformModuleId[],
  protectedPermissions: PlatformModuleId[],
  categoryPermissions: PlatformModuleId[],
): PlatformModuleId[] {
  const categoryPermissionSet = new Set(categoryPermissions);
  const protectedPermissionSet = new Set(protectedPermissions);

  return selectedPermissions.filter((permissionId) =>
    !categoryPermissionSet.has(permissionId) || protectedPermissionSet.has(permissionId),
  );
}

export function togglePermissionId(
  selectedPermissions: PlatformModuleId[],
  protectedPermissions: PlatformModuleId[],
  permissionId: PlatformModuleId,
): PlatformModuleId[] {
  const isSelected = selectedPermissions.includes(permissionId);
  const isProtected = protectedPermissions.includes(permissionId);

  if (isSelected && isProtected) {
    return selectedPermissions;
  }

  return isSelected
    ? selectedPermissions.filter((currentId) => currentId !== permissionId)
    : [...selectedPermissions, permissionId];
}

export function clearPermissionsWithProtection(
  selectedPermissions: PlatformModuleId[],
  protectedPermissions: PlatformModuleId[],
): PlatformModuleId[] {
  if (protectedPermissions.length === 0) return [];

  const protectedPermissionSet = new Set(protectedPermissions);
  return selectedPermissions.filter((permissionId) => protectedPermissionSet.has(permissionId));
}
