import type { ErrorAnalysisSummaryRow } from './error-analysis-export-types';

export function stringifyErrorAnalysisCsv(rows: ErrorAnalysisSummaryRow[]) {
  const headers = Object.keys(rows[0] || {});

  return [
    headers.join(','),
    ...rows.map(row =>
      headers.map(header => {
        const value = row[header as keyof ErrorAnalysisSummaryRow];
        const escapedValue = String(value).replace(/"/g, '""');
        return `"${escapedValue}"`;
      }).join(',')
    ),
  ].join('\n');
}

export function buildErrorAnalysisCsvHeaders(exportDate: string) {
  return {
    'Content-Type': 'text/csv;charset=utf-8',
    'Content-Disposition': `attachment; filename="error-analysis-${exportDate}.csv"`,
  };
}
