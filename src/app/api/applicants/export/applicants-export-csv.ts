import type { ApplicantsExportRow } from './applicants-export-row';

function escapeCsvValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  const stringValue = String(value);
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

export function convertToCsv(data: ApplicantsExportRow[]): string {
  if (!data || data.length === 0) {
    return '';
  }

  const headers = Object.keys(data[0]);
  const csvRows = [headers.map(escapeCsvValue).join(',')];

  for (const row of data) {
    csvRows.push(headers.map((header) => escapeCsvValue(row[header])).join(','));
  }

  return csvRows.join('\n');
}
