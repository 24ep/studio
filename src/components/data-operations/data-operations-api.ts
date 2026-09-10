import { buildPositionsTemplateCsvContent } from '@/components/positions/import-positions-modal-utils';
import { getJsonArray, getJsonNumber, getJsonObject, getJsonString, readJsonObject, type JsonObject } from '@/lib/response-json';
import { sanitizeUrl } from '@/lib/security';

export type ExportFormat = 'excel' | 'csv' | 'jsonl';

export const DATA_TRANSFER_DOMAIN_OPTIONS = [
  { id: 'people', label: 'People & organization', description: 'Employees, departments, mobility settings, and employee lifecycle references.' },
  { id: 'recruiting', label: 'Recruiting', description: 'Applicants, positions, job matches, and hiring history.' },
  { id: 'attendance', label: 'Attendance & shifts', description: 'Attendance logs, shift templates, rosters, and time reporting.' },
  { id: 'leave', label: 'Leave', description: 'Leave entitlements, requests, calendars, and balance history.' },
  { id: 'performance', label: 'Performance', description: 'Goals, evaluations, competencies, and recognition records.' },
  { id: 'learning', label: 'Learning', description: 'Courses, lessons, certifications, and related assignments.' },
  { id: 'payroll', label: 'Payroll & compensation', description: 'Payroll runs, compensation settings, and payslip-related data.' },
  { id: 'surveys', label: 'Surveys', description: 'Survey definitions, assignments, and response records.' },
  { id: 'expenses', label: 'Expenses & travel', description: 'Expense claims, advances, travel entries, and reimbursement data.' },
  { id: 'configuration', label: 'Business configuration', description: 'Core setup records, roles, benefits, and operational defaults.' },
] as const;

export type DataTransferDomain = (typeof DATA_TRANSFER_DOMAIN_OPTIONS)[number]['id'];
export type DataOperationModelId = 'applicants' | 'positions' | 'system-transfer' | `system-transfer:${DataTransferDomain}`;

export interface DataOperationModel {
  id: DataOperationModelId;
  name: string;
  description: string;
  accept: string;
  importTypesLabel: string;
  exportFormatsLabel: string;
  uploadHelp: string;
  templateHelp: string;
  importBehavior: string;
  reviewHelp: string;
  systemTransferDomain?: DataTransferDomain;
}

export interface ImportResult {
  jobId: string;
  status: 'pending';
  summary: string;
}

const ABSOLUTE_MAX_IMPORT_SIZE = 100 * 1024 * 1024;
const DATA_TRANSFER_DOMAINS = new Set(DATA_TRANSFER_DOMAIN_OPTIONS.map((entry) => entry.id));

const systemTransferHelpers: DataOperationModel = {
  id: 'system-transfer',
  name: 'System data transfer (all domains)',
  description: 'Permission-controlled business data package for migration between compatible HRI systems.',
  accept: '.jsonl,.json,application/json',
  importTypesLabel: 'JSONL package',
  exportFormatsLabel: 'JSONL',
  uploadHelp: 'JSONL · admin-configured size limit',
  templateHelp: 'Create a compatible package from the export tab first',
  importBehavior: 'Validate the package, then merge records by primary key in one transaction',
  reviewHelp: 'Credentials, sessions, API keys, audit internals, logs, notifications, and queue payloads are never imported.',
};

const systemTransferDomainModels: DataOperationModel[] = DATA_TRANSFER_DOMAIN_OPTIONS.map((domain) => ({
  id: `system-transfer:${domain.id}`,
  name: `${domain.label} data`,
  description: domain.description,
  accept: '.jsonl,.json,application/json',
  importTypesLabel: 'JSONL package',
  exportFormatsLabel: 'JSONL',
  uploadHelp: 'JSONL · admin-configured size limit',
  templateHelp: 'Export this model first to create a compatible package.',
  importBehavior: 'Validate the package, then merge records by primary key in one transaction',
  reviewHelp: 'Credentials, sessions, API keys, audit internals, logs, notifications, and queue payloads are never imported.',
  systemTransferDomain: domain.id,
}));

export const DATA_OPERATION_MODELS: DataOperationModel[] = [
  {
    id: 'applicants',
    name: 'Applicants',
    description: 'Candidate profiles, recruiting stages, sources, and matching information.',
    accept: '.xlsx,.csv',
    importTypesLabel: 'Excel or CSV',
    exportFormatsLabel: 'Excel or CSV',
  uploadHelp: 'XLSX or CSV · admin-configured size limit',
    templateHelp: 'Excel workbook with field instructions',
    importBehavior: 'Create new records; update rows that include an existing ID',
    reviewHelp: 'Rows with a blank ID create applicants. Rows with an existing applicant ID update that record.',
  },
  {
    id: 'positions',
    name: 'Job openings',
    description: 'Position titles, departments, descriptions, levels, and open status.',
    accept: '.csv,text/csv',
    importTypesLabel: 'CSV',
    exportFormatsLabel: 'Excel',
    uploadHelp: 'UTF-8 CSV · admin-configured size limit · up to 1,000 rows',
    templateHelp: 'UTF-8 CSV with supported headers and examples',
    importBehavior: 'Create new records; duplicate title and department pairs are skipped',
    reviewHelp: 'Existing title and department pairs are skipped. New positions are created in batches.',
  },
  systemTransferHelpers,
  ...systemTransferDomainModels,
];

function isSystemTransferModel(modelId: DataOperationModelId) {
  return modelId === 'system-transfer' || modelId.startsWith('system-transfer:');
}

function getSystemTransferDomainFromModelId(modelId: DataOperationModelId): DataTransferDomain | undefined {
  if (!modelId.startsWith('system-transfer:')) return undefined;
  const value = modelId.slice('system-transfer:'.length);
  const candidate = value as DataTransferDomain;
  return DATA_TRANSFER_DOMAINS.has(candidate) ? candidate : undefined;
}

export function getSystemTransferDomainLabel(domain?: DataTransferDomain) {
  if (!domain) return '';
  return DATA_TRANSFER_DOMAIN_OPTIONS.find((item) => item.id === domain)?.label || domain;
}

export function getImportFileError(model: DataOperationModelId, file: File | null) {
  if (!file) return null;
  if (file.size > ABSOLUTE_MAX_IMPORT_SIZE) return 'File too large. The platform cannot accept files larger than 100 MB.';
  if (isSystemTransferModel(model)) return ['.jsonl', '.json'].some((suffix) => file.name.toLowerCase().endsWith(suffix)) ? null : 'Please select an HRI system data transfer package.';
  if (model === 'positions') return file.name.toLowerCase().endsWith('.csv') ? null : 'Please select a CSV file (.csv). Only CSV files are supported.';
  if (!/\.(xlsx|csv)$/i.test(file.name)) return 'Choose an Excel (.xlsx) or CSV file.';
  return null;
}

export async function downloadImportTemplate(model: DataOperationModelId) {
  if (isSystemTransferModel(model)) throw new Error('Export system data first to create a compatible package.');
  if (model === 'positions') {
    downloadBlob(new Blob([buildPositionsTemplateCsvContent()], { type: 'text/csv;charset=utf-8' }), 'positions_import_template.csv');
    return;
  }
  const response = await fetch('/api/applicants/import');
  if (!response.ok) throw new Error(await readResponseError(response, 'Could not download the applicant template.'));
  downloadBlob(await response.blob(), getResponseFilename(response, 'applicants_import_template.xlsx'));
}

export async function importData(model: DataOperationModelId, file: File): Promise<ImportResult> {
  const validationError = getImportFileError(model, file);
  if (validationError) throw new Error(validationError);
  const body = new FormData();
  body.append('file', file);
  body.append('operation', 'import');
  body.append('entityType', isSystemTransferModel(model) ? 'system-transfer' : model);
  const transferDomain = getSystemTransferDomainFromModelId(model);
  if (transferDomain) body.append('parameters', JSON.stringify({ domains: [transferDomain] }));
  const response = await fetch('/api/data-operations/jobs', { method: 'POST', body });
  const data = await readJsonObject(response);
  if (!response.ok) throw new Error(formatImportError(data, response.status));
  const jobId = getJsonString(data, 'jobId');
  if (!jobId) throw new Error('The server queued the import without returning a job ID.');
  const label = DATA_OPERATION_MODELS.find((item) => item.id === model)?.name ?? model;
  const validation = getJsonObject(data, 'validation');
  const modelCount = validation ? getJsonNumber(validation, 'modelCount') : undefined;
  const rowCount = validation ? getJsonNumber(validation, 'rowCount') : undefined;
  const validationSummary = modelCount !== undefined && rowCount !== undefined ? ` Validated ${rowCount.toLocaleString()} rows across ${modelCount} models.` : '';
  return { jobId, status: 'pending', summary: `${label} import added to the queue.${validationSummary}` };
}

export async function exportData(model: DataOperationModelId, format: ExportFormat, filters: Record<string, string>) {
  const body = new FormData();
  const isSystemTransfer = isSystemTransferModel(model);
  const transferDomain = getSystemTransferDomainFromModelId(model);
  body.append('operation', 'export');
  body.append('entityType', isSystemTransfer ? 'system-transfer' : model);
  body.append('format', isSystemTransfer ? 'jsonl' : model === 'positions' ? 'excel' : format);
  const parameters: Record<string, unknown> = isSystemTransfer ? {} : { ...filters };
  if (isSystemTransfer) parameters.domains = transferDomain ? [transferDomain] : (filters.transferDomains || '').split(',').filter(Boolean);
  body.append('parameters', JSON.stringify(parameters));
  const response = await fetch('/api/data-operations/jobs', { method: 'POST', body });
  const data = await readJsonObject(response);
  if (!response.ok) throw new Error(getJsonString(data, 'error') || `Could not queue ${model} export.`);
  const jobId = getJsonString(data, 'jobId');
  if (!jobId) throw new Error('The server queued the export without returning a job ID.');
  return { jobId, status: 'pending' as const };
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const safeUrl = sanitizeUrl(url);
  try {
    if (!safeUrl) throw new Error('Could not create a safe download URL.');
    const anchor = document.createElement('a');
    anchor.href = safeUrl;
    anchor.download = filename;
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  } finally {
    URL.revokeObjectURL(url);
  }
}

function getResponseFilename(response: Response, fallback: string) {
  const disposition = response.headers.get('content-disposition') ?? '';
  const utf8 = disposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  const plain = disposition.match(/filename="?([^";]+)"?/i)?.[1];
  const value = utf8 ? decodeURIComponent(utf8) : plain;
  return value?.replace(/[\\/:*?"<>|]/g, '_') || fallback;
}

async function readResponseError(response: Response, fallback: string) {
  const data = await readJsonObject(response);
  return getJsonString(data, 'error') || getJsonString(data, 'message') || fallback;
}

function formatImportError(data: JsonObject, status: number) {
  const details = getJsonArray(data, 'details');
  if (details?.length) {
    const first = details[0];
    if (first && typeof first === 'object' && !Array.isArray(first)) {
      const row = getJsonNumber(first as JsonObject, 'row');
      return `${getJsonString(data, 'error') || 'Validation failed'}${row ? ` at row ${row}` : ''}. Review the template and try again.`;
    }
  }
  return getJsonString(data, 'error') || getJsonString(data, 'message') || `Import failed (HTTP ${status}).`;
}
