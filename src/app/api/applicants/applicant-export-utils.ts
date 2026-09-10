type JsonRecord = Record<string, unknown>;

const MAX_EXCEL_CELL_LENGTH = 32767;

export type ApplicantJobMatchForExport = {
  jobTitle?: string | null;
  fitScore?: number | null;
  matchReasons?: readonly string[] | null;
};

export function isExportJsonRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function formatDateForExport(date: string | Date | null | undefined): string {
  if (!date) return '';
  return new Date(date).toISOString().split('T')[0];
}

export function extractFromParsedData(parsedData: unknown, path: string): unknown {
  if (!isExportJsonRecord(parsedData)) return null;

  return path.split('.').reduce<unknown>((current, key) => {
    if (isExportJsonRecord(current) && key in current) {
      return current[key];
    }

    return null;
  }, parsedData);
}

export function formatAssignmentJustification(justification: unknown): string {
  if (!justification) return '';

  if (Array.isArray(justification)) {
    return justification.filter(Boolean).map(String).join('; ');
  }

  if (typeof justification === 'string') {
    return justification.split('\n').map(segment => segment.trim()).filter(Boolean).join('; ');
  }

  return '';
}

export function formatJobMatches(jobMatches: readonly ApplicantJobMatchForExport[] | null | undefined): string {
  if (!jobMatches || jobMatches.length === 0) return '';

  return jobMatches.map(match => {
    const parts: string[] = [];
    if (match.jobTitle) parts.push(`Job: ${match.jobTitle}`);
    if (match.fitScore !== null && match.fitScore !== undefined) {
      parts.push(`Score: ${Math.round(match.fitScore * 100)}%`);
    }
    if (match.matchReasons && match.matchReasons.length > 0) {
      parts.push(`Reasons: ${match.matchReasons.join(', ')}`);
    }
    return parts.join(' | ');
  }).join('; ');
}

export function truncateForExcel(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  const stringValue = String(value);
  return stringValue.length > MAX_EXCEL_CELL_LENGTH
    ? stringValue.substring(0, MAX_EXCEL_CELL_LENGTH)
    : stringValue;
}

export function stringifyJsonForExcel(value: unknown): string {
  return value ? truncateForExcel(JSON.stringify(value)) : '';
}

export function formatFitScoreForExport(fitScore: number | null | undefined): string {
  return fitScore === null || fitScore === undefined
    ? ''
    : Math.round(fitScore * 100).toString();
}
