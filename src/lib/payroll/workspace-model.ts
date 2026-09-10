import { payrollPeriodDatesAreValid } from "@/lib/payroll/workflow-rules";

export type PayrollWorkspaceRow = Record<string, unknown>;

export type PayrollApprovalStep = {
  id: string;
  sequence: number;
  role: string;
  status: string;
  approverId: string;
  approverName: string;
  decisionReason: string;
  decidedAt: unknown;
};

export type ApprovalStatusStyle = {
  label: string;
  labelClass: string;
  badgeClass: string;
  initialsClass: string;
};

export function payrollPeriodIsRunnable(period: PayrollWorkspaceRow | undefined) {
  if (!period || String(period.status) !== "open") return false;
  return payrollPeriodDatesAreValid(
    String(period.start_date).slice(0, 10),
    String(period.end_date).slice(0, 10),
    String(period.pay_date).slice(0, 10),
  );
}

export function initialsFromName(value: unknown) {
  const text = String(value || "").trim();
  if (!text) return "NA";
  const parts = text.split(/\s+/).filter(Boolean);
  if (!parts.length) return "NA";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export function parseApprovalSteps(raw: unknown): PayrollApprovalStep[] {
  if (!raw) return [];
  let parsed = raw;
  if (typeof raw === "string") {
    try {
      parsed = JSON.parse(raw);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(parsed)) return [];
  return parsed
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const step = item as Record<string, unknown>;
      const sequence = Number(step.sequence);
      const status = String(step.status || "pending");
      return {
        id: String(step.id || ""),
        sequence: Number.isFinite(sequence) ? sequence : 0,
        role: String(step.role || ""),
        status,
        approverId: String(step.approver_id || ""),
        approverName: String(step.approver_name || ""),
        decisionReason: String(step.decision_reason || ""),
        decidedAt: step.decided_at,
      } as PayrollApprovalStep;
    })
    .filter((step): step is PayrollApprovalStep => step !== null);
}

export function approvalStepStyle(
  statusRaw: unknown,
  thai = false,
): ApprovalStatusStyle {
  const status = String(statusRaw || "pending")
    .toLowerCase()
    .trim();
  if (
    [
      "approved",
      "approved_by",
      "approved_at",
      "completed",
      "done",
      "success",
    ].includes(status)
  ) {
    return {
      label: thai ? "approved" : "Approved",
      labelClass: "text-emerald-600 dark:text-emerald-300",
      badgeClass: "bg-emerald-600",
      initialsClass: "bg-emerald-600",
    };
  }
  if (
    ["rejected", "returned", "blocked", "failed", "denied"].includes(status)
  ) {
    return {
      label: thai ? "rejected" : "Rejected",
      labelClass: "text-rose-600 dark:text-rose-300",
      badgeClass: "bg-rose-600",
      initialsClass: "bg-rose-600",
    };
  }
  if (
    ["in_progress", "reviewing", "under_review", "pending_review"].includes(
      status,
    )
  ) {
    return {
      label: thai ? "in progress" : "In progress",
      labelClass: "text-blue-600 dark:text-blue-300",
      badgeClass: "bg-blue-600",
      initialsClass: "bg-blue-600",
    };
  }
  if (
    ["waiting", "pending", "open", "queued", "not_started"].includes(status)
  ) {
    return {
      label: thai ? "waiting" : "Waiting",
      labelClass: "text-amber-600 dark:text-amber-300",
      badgeClass: "bg-amber-600",
      initialsClass: "bg-amber-600",
    };
  }
  return {
    label: thai ? "pending" : "Pending",
    labelClass: "text-amber-600 dark:text-amber-300",
    badgeClass: "bg-amber-600",
    initialsClass: "bg-amber-600",
  };
}

export function payrollProgressCursor(statusRaw: unknown): number {
  const status = String(statusRaw || "")
    .toLowerCase()
    .trim();
  if (["draft", "returned_for_correction"].includes(status)) return 0;
  if (status === "collecting_inputs") return 1;
  if (["calculated", "exceptions_pending", "exception_found"].includes(status)) {
    return 2;
  }
  if (status === "pending_approval") return 3;
  if (status === "approved" || status === "finalized") return 4;
  if (status === "payment_processing") return 5;
  if (
    ["paid", "reconciled", "closed", "reversal_pending", "reversed"].includes(
      status,
    )
  ) {
    return 6;
  }
  return 0;
}

export function payrollProgressStepState(
  stepIndex: number,
  cursor: number,
  total: number,
) {
  const normalizedCursor = Math.max(0, cursor);
  const completedThrough = Math.min(normalizedCursor, total);
  return {
    completed: stepIndex < completedThrough,
    active: stepIndex === normalizedCursor && normalizedCursor < total,
    label:
      stepIndex < completedThrough
        ? "done"
        : stepIndex === normalizedCursor && normalizedCursor < total
          ? "active"
          : "pending",
  } as {
    completed: boolean;
    active: boolean;
    label: "done" | "active" | "pending";
  };
}

export function reviewerRoleLabel(roleRaw: unknown, thai = false) {
  const role = String(roleRaw || "").trim();
  if (!role) return thai ? "ผู้ตรวจสอบ" : "Reviewer";
  const normalized = role.toLowerCase();
  if (normalized === "manager") return thai ? "ผู้จัดการ" : "Manager";
  if (normalized === "hr" || normalized === "human resources") {
    return thai ? "ฝ่ายบุคคล" : "HR";
  }
  if (normalized === "finance") return thai ? "ฝ่ายการเงิน" : "Finance";
  if (normalized === "payroll") {
    return thai ? "ทีมบัญชีเงินเดือน" : "Payroll team";
  }
  if (normalized === "payroll owner" || normalized === "payroll_owner") {
    return thai ? "ผู้รับผิดชอบเงินเดือน" : "Payroll owner";
  }
  if (normalized === "accounting") return thai ? "ฝ่ายบัญชี" : "Accounting";
  return role;
}

export function payrollReviewerFromSteps(steps: PayrollApprovalStep[]) {
  const normalized = steps.map((step) => ({
    ...step,
    status: String(step.status || "")
      .toLowerCase()
      .trim(),
  }));
  const activeStep = normalized.find((step) =>
    ["pending", "queued", "in_progress", "reviewing"].includes(step.status),
  );
  return activeStep || normalized[0] || null;
}
