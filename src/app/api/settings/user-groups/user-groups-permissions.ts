import type { PlatformModuleId } from '@/lib/types';
import { PLATFORM_MODULES } from '@/lib/types';
import { expandPermissionSet } from '@/lib/permission-aliases';

const validPlatformModuleIds = new Set(PLATFORM_MODULES.map(module => module.id));

export function normalizePermissions(permissions?: string[] | null): PlatformModuleId[] {
  if (!Array.isArray(permissions)) {
    return [];
  }

  return Array.from(
    new Set(
      expandPermissionSet(permissions).filter((permission): permission is PlatformModuleId =>
        validPlatformModuleIds.has(permission as PlatformModuleId)
      )
    )
  );
}

export function validateAndNormalizePermissions(permissions: string[]) {
  const expandedPermissions = expandPermissionSet(permissions);
  const invalidPermissions = expandedPermissions.filter(permission => !validPlatformModuleIds.has(permission));

  return invalidPermissions.length > 0
    ? { ok: false as const, invalidPermissions }
    : { ok: true as const, permissions: normalizePermissions(expandedPermissions) };
}
