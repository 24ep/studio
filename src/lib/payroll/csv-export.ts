const FORMULA_PREFIX = /^[=+\-@]/;

/**
 * Convert a value to an RFC 4180-compatible CSV cell while neutralising
 * spreadsheet formula injection for user-controlled text values. Native
 * numbers remain numeric, including legitimate negative payroll adjustments.
 */
export function payrollCsvCell(value: unknown) {
  const isText = typeof value === "string";
  let text = value === null || value === undefined ? "" : String(value);
  if (isText && FORMULA_PREFIX.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

export function buildPayrollCsv(headers: string[], rows: unknown[][]) {
  return [headers, ...rows]
    .map((row) => row.map(payrollCsvCell).join(","))
    .join("\r\n");
}
