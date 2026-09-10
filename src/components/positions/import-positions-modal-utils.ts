import {
  getJsonArray,
  getJsonNumber,
  getJsonString,
  type JsonObject,
  type JsonValue,
} from '../../lib/response-json';

export type PositionImportStatus = 'idle' | 'uploading' | 'processing' | 'completed' | 'error';

export interface PositionImportResult {
  success: number;
  failed: number;
  processingTime?: number;
  errors: string[];
  message?: string;
}

export const ACCEPTED_POSITION_IMPORT_FILE_TYPES = ['.csv', 'text/csv'].join(',');
export const MAX_POSITION_IMPORT_FILE_SIZE = 10 * 1024 * 1024;
export const MAX_POSITION_IMPORT_COUNT = 1000;

const POSITION_TEMPLATE_HEADERS = [
  'title',
  'department',
  'description',
  'matchCriteria',
  'isOpen',
  'positionLevel',
  'custom_attributes',
];

const POSITION_TEMPLATE_ROWS = [
  [
    'Software Engineer',
    'Engineering',
    'Develops software applications. Responsible for backend and frontend development.',
    '',
    'true',
    'Mid-Level',
    '',
  ],
  [
    'Product Manager',
    'Product',
    'Manages product lifecycle and leads product strategy.',
    '',
    'true',
    'Senior',
    '',
  ],
  [
    'Data Analyst',
    'Analytics',
    'Analyzes data and creates reports for business insights.',
    '',
    'true',
    'Junior',
    '',
  ],
  [
    '\u0e27\u0e34\u0e28\u0e27\u0e01\u0e23\u0e0b\u0e2d\u0e1f\u0e15\u0e4c\u0e41\u0e27\u0e23\u0e4c',
    '\u0e27\u0e34\u0e28\u0e27\u0e01\u0e23\u0e23\u0e21',
    '\u0e1e\u0e31\u0e12\u0e19\u0e32\u0e41\u0e2d\u0e1b\u0e1e\u0e25\u0e34\u0e40\u0e04\u0e0a\u0e31\u0e19\u0e0b\u0e2d\u0e1f\u0e15\u0e4c\u0e41\u0e27\u0e23\u0e4c \u0e23\u0e31\u0e1a\u0e1c\u0e34\u0e14\u0e0a\u0e2d\u0e1a\u0e01\u0e32\u0e23\u0e1e\u0e31\u0e12\u0e19\u0e32\u0e14\u0e49\u0e32\u0e19\u0e2b\u0e25\u0e31\u0e07\u0e41\u0e25\u0e30\u0e14\u0e49\u0e32\u0e19\u0e2b\u0e19\u0e49\u0e32',
    '',
    'true',
    '\u0e23\u0e30\u0e14\u0e31\u0e1a\u0e01\u0e25\u0e32\u0e07',
    '',
  ],
];

function getStringArray(value: JsonValue[] | undefined) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

export function normalizePositionImportResult(value: JsonObject): PositionImportResult {
  return {
    success: getJsonNumber(value, 'success') ?? 0,
    failed: getJsonNumber(value, 'failed') ?? 0,
    processingTime: getJsonNumber(value, 'processingTime'),
    errors: getStringArray(getJsonArray(value, 'errors')),
    message: getJsonString(value, 'message'),
  };
}

export function getPositionImportFileValidationError(file: Pick<File, 'size' | 'type' | 'name'> | null | undefined) {
  if (!file) {
    return null;
  }

  if (file.size > MAX_POSITION_IMPORT_FILE_SIZE) {
    return `File too large. Maximum size is ${MAX_POSITION_IMPORT_FILE_SIZE / (1024 * 1024)}MB`;
  }

  const acceptedTypes = ACCEPTED_POSITION_IMPORT_FILE_TYPES.split(',');
  const fileName = file.name.toLowerCase();
  if (!acceptedTypes.includes(file.type) && !fileName.endsWith('.csv')) {
    return 'Please select a CSV file (.csv). Only CSV files are supported.';
  }

  return null;
}

function escapeCsvCell(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

export function buildPositionsTemplateCsvContent() {
  const rows = [
    POSITION_TEMPLATE_HEADERS.join(','),
    ...POSITION_TEMPLATE_ROWS.map((row) => row.map((value) => escapeCsvCell(value)).join(',')),
  ];

  return `\uFEFF${rows.join('\n')}`;
}

export function getPositionImportStatusText(status: PositionImportStatus) {
  switch (status) {
    case 'uploading':
      return 'Uploading file...';
    case 'processing':
      return 'Processing positions...';
    case 'completed':
      return 'Import completed';
    case 'error':
      return 'Import failed';
    default:
      return 'Upload & Import';
  }
}

export function getPositionImportSuccessMessage(result: PositionImportResult) {
  let message = `Import completed successfully! ${result.success} positions imported, ${result.failed} failed.`;

  if (result.processingTime) {
    message += ` Processing time: ${(result.processingTime / 1000).toFixed(1)}s`;
  }

  if (result.errors.length > 0) {
    message += result.errors.length <= 3
      ? ` Warnings: ${result.errors.join(', ')}`
      : ` ${result.errors.length} warnings (check console for details)`;
  }

  return message;
}

export function isPositionImportAbortError(error: unknown) {
  return error instanceof DOMException && error.name === 'AbortError';
}

export function getPositionImportErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}
