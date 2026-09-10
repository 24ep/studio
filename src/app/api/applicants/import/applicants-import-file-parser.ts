import { parse as parseCsv } from 'csv-parse/sync';
import ExcelJS from 'exceljs';
import type { ApplicantImportInput } from './applicants-import-schema';

type ImportRow = Record<string, unknown>;

export interface ParsedApplicantImportFile {
  applicants: Partial<ApplicantImportInput>[];
  totalRows: number;
}

function hasFileExtension(fileName: string, extensions: string[]) {
  return extensions.some((extension) => fileName.endsWith(extension));
}

function readRowValue(row: ImportRow, ...keys: string[]): unknown {
  for (const key of keys) {
    const value = row[key];
    if (value !== undefined && value !== null && value !== '') {
      return value;
    }
  }

  return undefined;
}

function stringValue(row: ImportRow, ...keys: string[]): string {
  return String(readRowValue(row, ...keys) ?? '');
}

function nullableStringValue(row: ImportRow, ...keys: string[]): string | null {
  const value = readRowValue(row, ...keys);
  return value === undefined ? null : String(value);
}

function normalizeExcelCellValue(value: unknown): unknown {
  if (value && typeof value === 'object' && 'text' in value) {
    return (value as { text?: unknown }).text;
  }

  return value;
}

function mapImportRow(row: ImportRow): Partial<ApplicantImportInput> {
  return {
    id: stringValue(row, 'ID', 'id') || undefined,
    name: stringValue(row, 'Name*', 'Name', 'name'),
    email: stringValue(row, 'Email*', 'Email', 'email'),
    phone: nullableStringValue(row, 'Phone', 'phone'),
    positionId: nullableStringValue(row, 'Position ID', 'positionId'),
    positionName: stringValue(row, 'Position Name', 'positionName'),
    recruiterId: nullableStringValue(row, 'Recruiter ID', 'recruiterId'),
    recruiterName: stringValue(row, 'Recruiter Name', 'recruiterName'),
    fitScore: stringValue(row, 'Fit Score (0-100)', 'fitScore'),
    status: stringValue(row, 'Status*', 'Status', 'status') || 'Applied',
    statusId: nullableStringValue(row, 'Status ID', 'statusId'),
    applicationDate: stringValue(row, 'Application Date', 'applicationDate'),
    appliedJob: stringValue(row, 'Applied Job', 'appliedJob'),
    appliedJobJustification: stringValue(row, 'Applied Job Justification', 'appliedJobJustification'),
    jobMatches: stringValue(row, 'Job Matches', 'jobMatches'),
    location: stringValue(row, 'Location', 'location'),
    introductionAboutMe: stringValue(row, 'Introduction/About Me', 'introductionAboutMe'),
    education: stringValue(row, 'Education (JSON)', 'education'),
    experience: stringValue(row, 'Experience (JSON)', 'experience'),
    skills: stringValue(row, 'Skills (JSON)', 'skills'),
    jobSuitable: stringValue(row, 'Job Suitable (JSON)', 'jobSuitable'),
    customAttributes: stringValue(row, 'Custom Attributes (JSON)', 'customAttributes'),
  };
}

async function parseExcelApplicants(buffer: Buffer): Promise<Partial<ApplicantImportInput>[]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as unknown as ExcelJS.Buffer);

  const sheet = workbook.worksheets[0];
  if (!sheet) {
    return [];
  }

  const headers: Record<number, string> = {};
  sheet.getRow(1).eachCell((cell, colNumber) => {
    headers[colNumber] = String(cell.value || '');
  });

  const rows: ImportRow[] = [];
  sheet.eachRow((row, rowNumber) => {
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

  return rows.map(mapImportRow);
}

function parseCsvApplicants(buffer: Buffer): Partial<ApplicantImportInput>[] {
  const records = parseCsv(buffer.toString('utf-8'), { columns: true, skip_empty_lines: true });
  return records.map((row: ImportRow) => mapImportRow(row));
}

export async function parseApplicantImportFile(file: File): Promise<ParsedApplicantImportFile> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const fileName = file.name.toLowerCase();

  if (hasFileExtension(fileName, ['.xlsx'])) {
    const applicants = await parseExcelApplicants(buffer);
    return { applicants, totalRows: applicants.length };
  }

  if (hasFileExtension(fileName, ['.csv'])) {
    const applicants = parseCsvApplicants(buffer);
    return { applicants, totalRows: applicants.length };
  }

  throw new Error('Unsupported file type. Please upload Excel (.xlsx) or CSV files.');
}

export function filterImportRowsWithRequiredFields(applicants: Partial<ApplicantImportInput>[]) {
  return applicants.filter((applicant) => applicant.name?.trim() && applicant.email?.trim());
}
