import { hasPermission, type SessionLikeUser } from "@/lib/permissions";
import type { PlatformModuleId } from "@/lib/types";
import type { SidebarNavItem } from "./SidebarNavConfig";

function includesAnyModulePermission(
  modulePermissions: readonly PlatformModuleId[],
  permissionIds: readonly PlatformModuleId[],
) {
  return permissionIds.some(permissionId => modulePermissions.includes(permissionId));
}

export function hasSidebarItemPermission(
  item: SidebarNavItem,
  isAdmin: boolean,
  modulePermissions: readonly PlatformModuleId[],
  user: SessionLikeUser | null | undefined,
) {
  if (isAdmin) return true;
  if (item.adminOnly) return false;

  // Any role can gain access through the configurable permission catalog.
  if (item.permissionId && hasPermission(user, item.permissionId)) return true;
  if (item.permissionIds?.some(permissionId => hasPermission(user, permissionId))) return true;

  if (user?.role === "Employee") {
    return item.href === "/my-workday"
      || item.href === "/employee-portal"
      || item.href === "/ess"
      || item.href.startsWith("/ess/")
      || item.href === "/service-desk"
      || item.href.startsWith("/privacy-support/");
  }

  if (item.permissionId || item.permissionIds?.length) return false;

  if (item.href === "/dashboard" || item.href === "/") {
    return includesAnyModulePermission(modulePermissions, ["DASHBOARD_VIEW"]);
  }
  if (item.href === "/positions") {
    return includesAnyModulePermission(modulePermissions, ["POSITIONS_VIEW"]);
  }
  if (item.href === "/calendar") {
    return includesAnyModulePermission(modulePermissions, [
      "EVALUATION_LINKS_VIEW",
      "EVALUATION_LINKS_CREATE_OWN",
      "EVALUATION_LINKS_CREATE_ALL",
      "EVALUATION_LINKS_MANAGE_OWN",
      "EVALUATION_LINKS_MANAGE_ALL",
    ]);
  }
  if (item.href.startsWith("/settings/users")) {
    return includesAnyModulePermission(modulePermissions, ["USERS_VIEW"]);
  }
  if (
    item.href === "/settings/system-settings"
    || item.href === "/settings/system-preferences"
    || item.href === "/settings/system-prompts"
  ) {
    return includesAnyModulePermission(modulePermissions, ["SYSTEM_SETTINGS_VIEW"]);
  }
  if (item.href === "/settings/data-configuration") {
    return includesAnyModulePermission(modulePermissions, ["RECRUITMENT_STAGES_VIEW"]);
  }
  if (item.href === "/settings/webhooks") {
    return includesAnyModulePermission(modulePermissions, ["WEBHOOKS_VIEW"]);
  }
  if (item.href === "/settings/logs") {
    return includesAnyModulePermission(modulePermissions, ["LOGS_VIEW"]);
  }

  return true;
}
