import { resolveCompanyScope } from "@/lib/hr/company-scope";
import type { PayrollAccess } from "./contracts";

type Row = Record<string, unknown>;

export class PayrollServiceError extends Error {
  constructor(
    public code: string,
    message: string,
    public status = 400,
    public details?: unknown,
  ) {
    super(message);
  }
}

export function scope(
  access: PayrollAccess,
  requestedCompanyId?: string | null,
) {
  const resolved = resolveCompanyScope(
    access.actorCompanyId,
    requestedCompanyId,
  );
  if (!resolved.allowed) {
    throw new PayrollServiceError(
      "COMPANY_SCOPE_VIOLATION",
      "The requested company is outside your access scope.",
      403,
    );
  }
  return resolved.companyId;
}

export function number(value: unknown) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function matchesBenefitRules(employee: Row, rawRules: unknown) {
  if (!rawRules || typeof rawRules !== "object" || Array.isArray(rawRules))
    return true;
  const rules = rawRules as Record<string, unknown>;
  const values = (key: string) =>
    Array.isArray(rules[key]) ? (rules[key] as unknown[]).map(String) : [];
  const hireDate = employee.hire_date
    ? new Date(String(employee.hire_date))
    : null;
  const serviceMonths =
    hireDate && !Number.isNaN(hireDate.getTime())
      ? Math.max(0, (Date.now() - hireDate.getTime()) / 2_629_800_000)
      : Number.POSITIVE_INFINITY;
  return (
    (!values("employmentTypes").length ||
      values("employmentTypes").includes(
        String(employee.employment_type || ""),
      )) &&
    (!values("departmentIds").length ||
      values("departmentIds").includes(String(employee.department_id || ""))) &&
    (!values("locations").length ||
      values("locations").includes(String(employee.location || ""))) &&
    (!values("statuses").length ||
      values("statuses").includes(String(employee.status || ""))) &&
    serviceMonths >= number(rules.minimumServiceMonths)
  );
}

export function iso(value: unknown) {
  if (!value) return null;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? String(value) : date.toISOString();
}

export function formatReviewDateTimeLabel(value: unknown) {
  if (!value) return "";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return "";
  const calendar = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const clock = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return `${calendar.format(date)} ${clock.format(date)}`;
}

export function mapMoneyRows(rows: Row[]) {
  return rows.map((row) =>
    Object.fromEntries(
      Object.entries(row).map(([key, value]) =>
        /(^|_)(amount|salary|pay|cost|total|deductions|contribution|debit|credit)$/.test(
          key,
        )
          ? [key, number(value)]
          : [key, value instanceof Date ? value.toISOString() : value],
      ),
    ),
  );
}

export function formatDateLabel(value: unknown) {
  if (!value) return "";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function approvalStepStatusLabel(status: string) {
  if (status === "approved") return "approved";
  if (status === "returned" || status === "rejected") return "returned";
  if (status === "pending") return "pending";
  return "queued";
}

export function normalizeResponsibilityValue(value: unknown) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function matchesResponsibility(
  requiredRaw: string,
  candidateRaw: string,
) {
  const required = normalizeResponsibilityValue(requiredRaw);
  if (!required) return true;
  const candidate = normalizeResponsibilityValue(candidateRaw);
  if (!candidate) return false;
  if (
    required === candidate ||
    required.includes(candidate) ||
    candidate.includes(required)
  )
    return true;
  const requiredTokens = required.split(" ").filter(Boolean);
  const candidateTokens = candidate.split(" ").filter(Boolean);
  return (
    Boolean(requiredTokens.length && candidateTokens.length) &&
    requiredTokens.every((token) =>
      candidateTokens.some(
        (part) =>
          part === token || part.includes(token) || token.includes(part),
      ),
    )
  );
}

export function actorHasPayrollResponsibility(
  access: PayrollAccess,
  requiredRole: string,
) {
  if (!requiredRole) return true;
  return [
    access.actorUserRole || "",
    access.actorJobTitle || "",
    access.actorDepartment || "",
  ].some((candidate) => matchesResponsibility(requiredRole, candidate));
}

export function assertPayrollStepResponsibility(
  access: PayrollAccess,
  actorId: string,
  approval: Row,
) {
  if (access.isAdmin) return;
  const approverId = approval.approver_user_id;
  if (approverId && String(approverId) !== actorId) {
    throw new PayrollServiceError(
      "INVALID_APPROVAL_RESPONSIBILITY",
      "This payroll approval step is assigned to a different approver.",
      403,
      { assignedTo: String(approverId) },
    );
  }
  if (approverId) return;
  const requiredRole = String(approval.approval_role || "").trim();
  if (!actorHasPayrollResponsibility(access, requiredRole)) {
    throw new PayrollServiceError(
      "INVALID_APPROVAL_RESPONSIBILITY",
      "You are not assigned to this payroll approval responsibility.",
      403,
      { requiredRole, actorId },
    );
  }
}
