import { PayrollServiceError } from "./service-foundation";

/**
 * Convert a database or API date value to the canonical YYYY-MM-DD text that
 * PostgreSQL raw-query `::date` parameters expect. Prisma returns PostgreSQL
 * DATE values as JavaScript Date objects, so String(date) is not safe here.
 */
export function toSqlDate(value: unknown): string {
  if (value instanceof Date) {
    if (!Number.isNaN(value.getTime())) return value.toISOString().slice(0, 10);
  }

  if (typeof value === "string") {
    const dateOnly = value.match(/^\d{4}-\d{2}-\d{2}/)?.[0];
    if (dateOnly) return dateOnly;

    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
  }

  throw new PayrollServiceError(
    "INVALID_PAYROLL_PERIOD",
    "The selected payroll period contains an invalid date.",
    409,
  );
}
