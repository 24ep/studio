import { sanitizeUrl } from "../../lib/security";
import {
  getJsonArray,
  getJsonNumber,
  getJsonObject,
  getJsonString,
  readJsonObject,
  type JsonObject,
  type JsonValue,
} from "../../lib/response-json";

export interface ApplicantImportResults {
  created: number;
  updated: number;
  skipped: number;
  errors: string[];
}

export function isSupportedApplicantImportFile(fileName: string) {
  const normalizedFileName = fileName.toLowerCase();
  return normalizedFileName.endsWith('.xlsx')
    || normalizedFileName.endsWith('.csv');
}

export async function downloadApplicantImportTemplate() {
  const response = await fetch('/api/applicants/import');
  if (!response.ok) {
    throw new Error('Failed to download template');
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const safeUrl = sanitizeUrl(url);

  try {
    if (!safeUrl) {
      throw new Error('Failed to create template download URL');
    }

    const link = document.createElement('a');
    link.href = safeUrl;
    link.download = 'applicants_import_template.xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } finally {
    window.URL.revokeObjectURL(url);
  }
}

export async function importApplicantFile(file: File): Promise<ApplicantImportResults> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/applicants/import', {
    method: 'POST',
    body: formData,
  });
  const result = await readJsonObject(response);

  if (!response.ok) {
    throw new Error(formatApplicantImportErrorResponse(result));
  }

  return normalizeApplicantImportResults(result);
}

export function normalizeApplicantImportResults(data: JsonObject): ApplicantImportResults {
  const results = getJsonObject(data, 'results') ?? {};
  return {
    created: getJsonNumber(results, 'created') ?? 0,
    updated: getJsonNumber(results, 'updated') ?? 0,
    skipped: getJsonNumber(results, 'skipped') ?? 0,
    errors: getStringArray(getJsonArray(results, 'errors')),
  };
}

export function formatApplicantImportValidationDetail(detail: JsonValue) {
  if (!detail || typeof detail !== 'object' || Array.isArray(detail)) {
    return 'Invalid row: validation failed';
  }

  const detailRecord = detail as JsonObject;
  const row = getJsonNumber(detailRecord, 'row') ?? '?';
  const email = getJsonString(detailRecord, 'email') ?? 'unknown email';
  const errors = getJsonObject(detailRecord, 'errors') ?? {};
  const messages = Object.values(errors).flatMap((value) => (
    Array.isArray(value)
      ? value.filter((item): item is string => typeof item === 'string')
      : typeof value === 'string'
        ? [value]
        : []
  ));

  return `Row ${row} (${email}): ${messages.join(', ') || 'Validation failed'}`;
}

export function getApplicantImportSuccessMessage(results: ApplicantImportResults) {
  if (results.errors.length > 0) {
    return `Import completed with ${results.errors.length} errors. Created: ${results.created}, Updated: ${results.updated}`;
  }

  return `Import completed successfully! Created: ${results.created}, Updated: ${results.updated}`;
}

export function getApplicantImportErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Failed to import Applicants';
}

function formatApplicantImportErrorResponse(result: JsonObject) {
  const details = getJsonArray(result, 'details');
  if (details && details.length > 0) {
    return `Import failed:\n${details.map(formatApplicantImportValidationDetail).join('\n')}`;
  }

  return getJsonString(result, 'error') || 'Import failed';
}

function getStringArray(value: JsonValue[] | undefined) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}
