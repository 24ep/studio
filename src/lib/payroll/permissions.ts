import prisma from "@/lib/prisma";
import {
  hasAnyPermission,
  isAdminUser,
  type SessionLikeUser,
} from "@/lib/permissions";
import type { PayrollAccess } from "./contracts";

export async function getPayrollAccess(
  user: SessionLikeUser & { id?: string; email?: string | null },
): Promise<PayrollAccess> {
  const isAdmin = isAdminUser(user);
  const requestedManage = hasAnyPermission(user, ["HR_PAYROLL_MANAGE"]);
  const requestedApprove = hasAnyPermission(user, ["HR_PAYROLL_APPROVE"]);
  const requestedExport = hasAnyPermission(user, ["HR_PAYROLL_EXPORT"]);
  const requestedAmountView = hasAnyPermission(user, ["HR_PAYROLL_AMOUNT_VIEW"]);
  const requestedView =
    requestedManage ||
    requestedApprove ||
    requestedExport ||
    requestedAmountView ||
    hasAnyPermission(user, ["HR_PAYROLL_VIEW"]);
  const employee = user.id
    ? await prisma
        .$queryRawUnsafe<
          Array<{
            id: string;
            company_id: string | null;
            job_title: string | null;
            department: string | null;
          }>
        >(
          `SELECT employee.id, employee.company_id, employee.job_title, department.name AS department
     FROM hr_employees employee
     LEFT JOIN hr_departments department ON department.id = employee.department_id
     WHERE user_id = $1::uuid OR lower(email) = lower($2)
     ORDER BY CASE WHEN user_id = $1::uuid THEN 0 ELSE 1 END LIMIT 1`,
          user.id,
          user.email || "",
        )
        .catch(() => [])
    : [];

  const hasCompanyScope = Boolean(employee[0]?.company_id);
  const scoped = isAdmin || hasCompanyScope;
  return {
    isAdmin,
    canView: isAdmin || (hasCompanyScope && requestedView),
    canViewAmounts:
      isAdmin ||
      (hasCompanyScope &&
        (requestedAmountView || requestedManage || requestedApprove || requestedExport)),
    canManage: isAdmin || (hasCompanyScope && requestedManage),
    canApprove: isAdmin || (hasCompanyScope && requestedApprove),
    canExport: isAdmin || (hasCompanyScope && requestedExport),
    actorCompanyId: isAdmin ? null : employee[0]?.company_id || null,
    actorEmployeeId: employee[0]?.id || null,
    actorUserRole: user.role || null,
    actorJobTitle: employee[0]?.job_title || null,
    actorDepartment: employee[0]?.department || null,
  } satisfies PayrollAccess;
}

/**
 * Settlement evidence is more sensitive than ordinary payroll viewing because it
 * can contain bank confirmations, account references, and finance-operation
 * metadata. View-only payroll access therefore does not grant evidence access.
 */
export function canAccessPayrollSettlementEvidence(
  access: Pick<PayrollAccess, "canManage" | "canApprove" | "canExport">,
) {
  return access.canManage || access.canApprove || access.canExport;
}

export function maskPayrollReference(value: unknown) {
  const normalized = String(value || "").replace(/\s/g, "");
  return normalized ? `•••• ${normalized.slice(-4)}` : "Not provided";
}
