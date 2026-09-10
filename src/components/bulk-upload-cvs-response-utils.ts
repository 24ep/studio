import type { BulkUploadResultSummary } from "./bulk-upload-cvs-types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function getRecordProperty(value: unknown, propertyName: string): Record<string, unknown> | undefined {
  const property = isRecord(value) ? value[propertyName] : undefined;
  return isRecord(property) ? property : undefined;
}

function getArrayProperty(value: unknown, propertyName: string): unknown[] {
  const property = isRecord(value) ? value[propertyName] : undefined;
  return Array.isArray(property) ? property : [];
}

function getStringProperty(value: unknown, propertyName: string): string {
  const property = isRecord(value) ? value[propertyName] : undefined;
  return typeof property === "string" ? property : "";
}

function getNumberProperty(value: unknown, propertyName: string): number {
  const property = isRecord(value) ? value[propertyName] : undefined;
  return typeof property === "number" && Number.isFinite(property) ? property : 0;
}

export function summarizeBulkUploadResponse(result: unknown): BulkUploadResultSummary {
  const summary = getRecordProperty(result, "summary");
  const failedRows = getArrayProperty(result, "results")
    .filter((row) => getStringProperty(row, "status") === "failed");

  return {
    success: true,
    data: result,
    successful: getNumberProperty(summary, "success"),
    failed: getNumberProperty(summary, "failed"),
    errors: failedRows.map((row) => {
      const fileName = getStringProperty(row, "file_name") || "Unknown file";
      const error = getStringProperty(row, "error") || "Unknown error";
      return `${fileName}: ${error}`;
    }),
  };
}
