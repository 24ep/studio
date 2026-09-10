export interface LeaveBlockRecord {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  leaveType: string;
  scope: string;
  targetValue?: string | null;
  reason?: string | null;
  isActive: boolean | string;
}

export function dateValue(value: string) {
  return value.slice(0, 10);
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(
    new Date(value),
  );
}

export function isLeaveBlockActive(value: LeaveBlockRecord["isActive"]) {
  return value === true || value === "true";
}

export function formatLeaveBlockLabel(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}
