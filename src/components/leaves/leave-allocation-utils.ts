export type LeaveAllocationRow = Record<string, unknown>;

export function allocationValue(value: unknown, fallback = "—") {
  return value === null || value === undefined || value === ""
    ? fallback
    : String(value);
}

export function allocationNumber(value: unknown) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function allocationObject(value: unknown): LeaveAllocationRow {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as LeaveAllocationRow)
    : {};
}

export function allocationEmployeeName(row: LeaveAllocationRow) {
  return `${allocationValue(row.first_name, "Employee")} ${allocationValue(row.last_name, "")}`.trim();
}

export function allocationImpactRowId(row: LeaveAllocationRow, index: number) {
  return allocationValue(row.id ?? row.employee_id, `impact-${index}`);
}

export function displayAllocationDays(amount: number, signed = false) {
  const prefix = signed && amount > 0 ? "+" : "";
  return `${prefix}${amount.toFixed(1)} d`;
}
