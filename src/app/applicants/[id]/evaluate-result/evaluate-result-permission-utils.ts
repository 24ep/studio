import { permissionMatches } from "../../../../lib/permission-aliases";

interface ReportPermissionUser {
  id?: string | null;
  role?: string | null;
  modulePermissions?: string[] | null;
}

export function canEditEvaluateResultApplicantBasic(user?: ReportPermissionUser | null) {
  if (!user) {
    return false;
  }

  if (user.role === "Admin") {
    return true;
  }

  const modulePermissions = Array.isArray(user.modulePermissions)
    ? user.modulePermissions
    : [];

  return permissionMatches(modulePermissions, "APPLICANTS_EDIT_BASIC") ||
    permissionMatches(modulePermissions, "APPLICANTS_EDIT_BASIC_OWN") ||
    permissionMatches(modulePermissions, "APPLICANTS_EDIT_BASIC_ALL");
}
