import {
  arrayValue,
  dateKey,
  numberValue,
  type ShiftRecord,
} from "../shift-types";

export function mondayFor(value = new Date()) {
  const date = new Date(
    Date.UTC(value.getFullYear(), value.getMonth(), value.getDate()),
  );
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() - day + 1);
  return date.toISOString().slice(0, 10);
}

export function daysInWeek(start: string) {
  return Array.from({ length: 7 }, (_, index) => {
    const value = new Date(`${start}T00:00:00.000Z`);
    value.setUTCDate(value.getUTCDate() + index);
    return value;
  });
}

export function entriesForDay(sheet: ShiftRecord, workDate: string) {
  return arrayValue(sheet.entries).filter(
    (row) => dateKey(String(row.workDate || row.work_date)) === workDate,
  );
}

export function allocatedForDay(
  sheet: ShiftRecord,
  workDate: string,
  project = "all",
) {
  return entriesForDay(sheet, workDate)
    .filter((row) => project === "all" || String(row.project || "") === project)
    .reduce(
      (sum, row) =>
        sum + numberValue(row.durationMinutes || row.duration_minutes),
      0,
    );
}

export function attendanceForDay(sheet: ShiftRecord, workDate: string) {
  const row = arrayValue(sheet.attendance).find(
    (item) => dateKey(String(item.workDate || item.work_date)) === workDate,
  );
  return numberValue(row?.workedMinutes || row?.worked_minutes);
}

export function displayAttendanceForDay(
  sheet: ShiftRecord,
  workDate: string,
  _days: Date[],
) {
  return attendanceForDay(sheet, workDate);
}

export function decimalHours(minutes: number) {
  return (minutes / 60).toFixed(2);
}

export function sheetTotalMinutes(sheet?: ShiftRecord) {
  return arrayValue(sheet?.entries).reduce(
    (sum, row) =>
      sum + numberValue(row.durationMinutes || row.duration_minutes),
    0,
  );
}

export function sheetBillableMinutes(sheet?: ShiftRecord) {
  return arrayValue(sheet?.entries)
    .filter((row) => Boolean(row.billable))
    .reduce(
      (sum, row) =>
        sum + numberValue(row.durationMinutes || row.duration_minutes),
      0,
    );
}
