import { parse as parseCsv } from 'csv-parse/sync';
import { MAX_FILE_SIZE, MAX_POSITIONS, type ImportPosition } from './positions-import-schema';

interface CsvErrorResult {
  ok: false;
  body: Record<string, unknown>;
  status: number;
}

interface CsvSuccessResult {
  ok: true;
  positions: ImportPosition[];
}

export type CsvImportParseResult = CsvSuccessResult | CsvErrorResult;

function detectAndConvertEncoding(buffer: Buffer): string {
  if (buffer.length >= 3 && buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) {
    return buffer.toString('utf-8');
  }

  try {
    const utf8String = buffer.toString('utf-8');
    try {
      parseCsv(utf8String, { columns: true, skip_empty_lines: true, max_record_size: 1000 });
      return utf8String;
    } catch {
      return utf8String;
    }
  } catch {
    // Fall through to legacy spreadsheet encodings.
  }

  try {
    const win1252String = buffer.toString('latin1');
    try {
      parseCsv(win1252String, { columns: true, skip_empty_lines: true, max_record_size: 1000 });
      return win1252String;
    } catch {
      // Fall through to final latin1 fallback.
    }
  } catch {
    // Fall through to final fallback.
  }

  try {
    return buffer.toString('latin1');
  } catch {
    return buffer.toString('utf-8');
  }
}

function parseCustomAttributes(value: unknown): Record<string, unknown> {
  if (typeof value !== 'string' || value.trim() === '') {
    return {};
  }

  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}

function combineDescriptions(row: Record<string, unknown>): string | null {
  const parts = [row.description, row.job_description]
    .filter((value): value is string => typeof value === 'string' && value.length > 0);

  return parts.length > 0 ? parts.join('\n\n') : null;
}

function mapCsvRow(row: Record<string, unknown>, defaultMatchCriteria: string): ImportPosition {
  const matchCriteria = typeof row.matchCriteria === 'string' && row.matchCriteria.trim() !== ''
    ? row.matchCriteria
    : defaultMatchCriteria;

  return {
    title: String(row.title ?? ''),
    department: typeof row.department === 'string' ? row.department : null,
    description: combineDescriptions(row),
    matchCriteria,
    isOpen: Boolean(row.isOpen && String(row.isOpen).toLowerCase() === 'true'),
    positionLevel: typeof row.positionLevel === 'string' ? row.positionLevel : null,
    custom_attributes: parseCustomAttributes(row.custom_attributes),
  };
}

export async function parseCsvImportFile(file: File, defaultMatchCriteria: string, maxFileSize = MAX_FILE_SIZE): Promise<CsvImportParseResult> {
  if (file.size > maxFileSize) {
    return {
      ok: false,
      body: { message: `File too large. Maximum size is ${maxFileSize / (1024 * 1024)}MB` },
      status: 400,
    };
  }

  if (!file.name.toLowerCase().endsWith('.csv')) {
    return {
      ok: false,
      body: { message: 'Only CSV import is currently supported via file upload.' },
      status: 400,
    };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  let csvString = detectAndConvertEncoding(buffer);

  if (csvString.charCodeAt(0) === 0xFEFF) {
    csvString = csvString.slice(1);
  }

  let records: Record<string, unknown>[];
  try {
    records = parseCsv(csvString, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });
  } catch (parseError) {
    const errorMessage = parseError instanceof Error ? parseError.message : 'Unknown parsing error';
    console.error('CSV parsing error:', parseError);
    console.error('CSV content that failed to parse:', csvString.substring(0, 1000));
    return {
      ok: false,
      body: {
        message: 'CSV parsing failed. Please ensure the file is a valid CSV with correct headers and UTF-8 encoding (required for Thai language support).',
        error: errorMessage,
        encoding: 'UTF-8 required for Thai language support',
      },
      status: 400,
    };
  }

  if (records.length === 0) {
    return {
      ok: false,
      body: { message: 'CSV file appears to be empty or has no valid data rows.' },
      status: 400,
    };
  }

  if (records.length > MAX_POSITIONS) {
    return {
      ok: false,
      body: { message: `Too many positions. Maximum allowed is ${MAX_POSITIONS}. Found ${records.length} positions.` },
      status: 400,
    };
  }

  const firstRecord = records[0];
  if (!firstRecord.title) {
    const availableHeaders = Object.keys(firstRecord);
    return {
      ok: false,
      body: {
        message: 'CSV must have a "title" column. Please check your CSV headers.',
        details: {
          availableHeaders,
          expectedHeaders: ['title', 'department', 'description', 'isOpen', 'positionLevel', 'custom_attributes'],
          missingHeaders: ['title'].filter((header) => !availableHeaders.includes(header)),
          firstRecord,
        },
      },
      status: 400,
    };
  }

  return {
    ok: true,
    positions: records.map((row) => mapCsvRow(row, defaultMatchCriteria)),
  };
}
