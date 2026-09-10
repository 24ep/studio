import {
  arrayValue,
  numberValue,
  stringValue,
  type ShiftRecord,
} from "../shift-types";

export function overtimeRequestDuration(row: ShiftRecord) {
  const recorded = numberValue(row.requested_minutes);
  if (recorded > 0) return recorded;
  const start = new Date(String(row.requested_start_at)).getTime();
  const end = new Date(String(row.requested_end_at)).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end)) return 0;
  return Math.max(0, Math.round((end - start) / 60_000));
}

export function overtimeRequestRisk(row: ShiftRecord) {
  return arrayValue(row.policy_warnings).length ? "Policy risk" : "Compliant";
}

export function overtimeEstimatedCost(row: ShiftRecord) {
  const raw =
    row.estimated_cost ??
    row.estimated_cost_amount ??
    row.estimated_payroll_cost;
  if (raw === null || raw === undefined || raw === "") return null;
  const parsed = numberValue(raw);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

export function overtimeWarningLabels(row: ShiftRecord) {
  return arrayValue(row.policy_warnings)
    .map((warning) => stringValue(warning))
    .filter(Boolean);
}
