import type { UserGroup } from "@/lib/types";

export const ROLE_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function validateRoleForDrawer(role: UserGroup | null) {
  if (!role) {
    console.error("UnifiedRoleDrawer: Role is null or undefined");
    return false;
  }

  if (!role.id || typeof role.id !== "string") {
    console.error("UnifiedRoleDrawer: Invalid role ID:", role.id, "type:", typeof role.id);
    return false;
  }

  if (!ROLE_ID_PATTERN.test(role.id)) {
    console.error("UnifiedRoleDrawer: Role ID is not a valid UUID:", role.id);
    return false;
  }

  if (!role.name || typeof role.name !== "string") {
    console.error("UnifiedRoleDrawer: Invalid role name:", role.name);
    return false;
  }

  if (!Array.isArray(role.permissions)) {
    console.warn("UnifiedRoleDrawer: Role permissions is not an array:", role.permissions);
  }

  return true;
}
