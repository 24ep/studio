import { parse as parseCsv } from 'csv-parse/sync';
import ExcelJS from 'exceljs';
import { safeJsonParse } from '@/lib/utils';

type ImportRow = Record<string, unknown>;

export class UnsupportedV1ApplicantImportFileError extends Error {
  constructor() {
    super('Unsupported file type. Please upload CSV or Excel files.');
  }
}

function readRowValue(row: ImportRow, ...keys: string[]) {
  for (const key of keys) {
    const value = row[key];
    if (value !== undefined && value !== null && value !== '') {
      return value;
    }
  }

  return undefined;
}

function nullableStringValue(row: ImportRow, ...keys: string[]) {
  const value = readRowValue(row, ...keys);
  return value === undefined ? null : String(value);
}

function optionalStringValue(row: ImportRow, ...keys: string[]) {
  const value = readRowValue(row, ...keys);
  return value === undefined ? undefined : String(value);
}

function normalizeExcelCellValue(value: unknown) {
  if (value && typeof value === 'object' && 'text' in value) {
    return (value as { text?: unknown }).text;
  }

  return value;
}

function parseOptionalFitScore(row: ImportRow) {
  const value = readRowValue(row, 'fitScore');
  return value ? parseFloat(String(value)) : null;
}

function mapV1ImportRow(row: ImportRow) {
  return {
    name: String(readRowValue(row, 'name', 'Name') ?? ''),
    email: String(readRowValue(row, 'email', 'Email') ?? ''),
    phone: nullableStringValue(row, 'phone', 'Phone'),
    status: optionalStringValue(row, 'status', 'Status'),
    positionId: nullableStringValue(row, 'positionId', 'position_id'),
    recruiterId: nullableStringValue(row, 'recruiterId', 'recruiter_id'),
    fitScore: parseOptionalFitScore(row),
    custom_attributes: safeJsonParse(String(row.custom_attributes ?? ''), {}),
    parsedData: safeJsonParse(String(row.parsedData ?? ''), null),
    resumePath: nullableStringValue(row, 'resumePath', 'resume_path'),
  };
}

async function parseExcelV1ImportRows(buffer: Buffer) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as unknown as ExcelJS.Buffer);

  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    return [];
  }

  const headers: Record<number, string> = {};
  worksheet.getRow(1).eachCell((cell, colNumber) => {
    headers[colNumber] = String(cell.value || '');
  });

  const rows: ImportRow[] = [];
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;

    const rowData: ImportRow = {};
    Object.values(headers).forEach((header) => {
      rowData[header] = '';
    });

    row.eachCell((cell, colNumber) => {
      const header = headers[colNumber];
      if (header) {
        rowData[header] = normalizeExcelCellValue(cell.value);
      }
    });
    rows.push(rowData);
  });

  return rows.map(mapV1ImportRow);
}

function parseCsvV1ImportRows(buffer: Buffer) {
  const records = parseCsv(buffer.toString('utf-8'), { columns: true, skip_empty_lines: true });
  return records.map((row: ImportRow) => mapV1ImportRow(row));
}

export async function parseV1ApplicantImportFile(file: File) {
  const buffer = Buffer.from(await file.arrayBuffer());
  const fileName = file.name.toLowerCase();

  if (fileName.endsWith('.csv')) {
    return parseCsvV1ImportRows(buffer);
  }

  if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
    return await parseExcelV1ImportRows(buffer);
  }

  throw new UnsupportedV1ApplicantImportFileError();
}
