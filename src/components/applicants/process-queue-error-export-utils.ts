import type {
  ProcessQueueAnalyticsData,
  ProcessQueueErrorExportRow,
} from "./process-queue-analytics-types";

export function getProcessQueueErrorSeverity(
  count: number,
  totalJobs: number
): "high" | "medium" | "low" {
  const errorRate = totalJobs > 0 ? (count / totalJobs) * 100 : 0;
  if (errorRate > 10) return "high";
  if (errorRate > 2) return "medium";
  return "low";
}

export function getProcessQueueErrorCategory(reason: string) {
  const normalizedReason = reason.toLowerCase();
  if (normalizedReason.includes("timeout")) return "Timeout Error";
  if (normalizedReason.includes("connection")) return "Network Error";
  if (normalizedReason.includes("invalid")) return "Invalid Data Error";
  if (normalizedReason.includes("parsing")) return "Parsing Error";
  if (normalizedReason.includes("file")) return "File Processing Error";
  if (normalizedReason.includes("api")) return "API Error";
  if (normalizedReason.includes("database")) return "Database Error";
  return "Unknown Error";
}

function formatProcessQueueErrorPercentage(count: number, totalJobs: number) {
  if (totalJobs <= 0) {
    return "0.0%";
  }

  return `${((count / totalJobs) * 100).toFixed(1)}%`;
}

export function buildProcessQueueErrorExportRows(
  errorsByReason: ProcessQueueAnalyticsData["stats"]["errorsByReason"],
  totalJobs: number,
  exportDate: string
): ProcessQueueErrorExportRow[] {
  const rows: ProcessQueueErrorExportRow[] = errorsByReason.map((item, index) => ({
    "No.": index + 1,
    "Error Reason": item.reason,
    "Error Category": getProcessQueueErrorCategory(item.reason),
    "Count": item.count,
    "Percentage": formatProcessQueueErrorPercentage(item.count, totalJobs),
    "Severity": getProcessQueueErrorSeverity(item.count, totalJobs),
    "Total Jobs": totalJobs,
    "Export Date": exportDate,
  }));

  const totalErrors = errorsByReason.reduce((sum, item) => sum + item.count, 0);
  rows.push({
    "No.": "",
    "Error Reason": "SUMMARY",
    "Error Category": "",
    "Count": totalErrors,
    "Percentage": formatProcessQueueErrorPercentage(totalErrors, totalJobs),
    "Severity": totalErrors > 0 ? "high" : "low",
    "Total Jobs": totalJobs,
    "Export Date": exportDate,
  });

  return rows;
}

export function buildSingleProcessQueueErrorExportRows(
  errorItem: ProcessQueueAnalyticsData["stats"]["errorsByReason"][number],
  totalJobs: number,
  exportDate: string
): ProcessQueueErrorExportRow[] {
  return [{
    "Error Reason": errorItem.reason,
    "Error Category": getProcessQueueErrorCategory(errorItem.reason),
    "Count": errorItem.count,
    "Percentage": formatProcessQueueErrorPercentage(errorItem.count, totalJobs),
    "Severity": getProcessQueueErrorSeverity(errorItem.count, totalJobs),
    "Total Jobs": totalJobs,
    "Export Date": exportDate,
  }];
}

export function stringifyProcessQueueErrorCsv(rows: ProcessQueueErrorExportRow[]) {
  const headers = Object.keys(rows[0] || {});
  return [
    headers.join(","),
    ...rows.map((row) =>
      headers.map((header) => {
        const value = row[header as keyof ProcessQueueErrorExportRow] ?? "";
        const escapedValue = String(value).replace(/"/g, "\"\"");
        return `"${escapedValue}"`;
      }).join(",")
    ),
  ].join("\n");
}
