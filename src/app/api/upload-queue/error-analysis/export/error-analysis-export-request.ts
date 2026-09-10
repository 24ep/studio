import { type NextRequest } from 'next/server';
import type { ErrorAnalysisExportFilters, ErrorAnalysisExportFormat } from './error-analysis-export-types';

export function parseErrorAnalysisExportFilters(request: NextRequest): ErrorAnalysisExportFilters {
  const { searchParams } = new URL(request.url);
  const requestedFormat = searchParams.get('format');

  return {
    dateStart: searchParams.get('date_start'),
    dateEnd: searchParams.get('date_end'),
    status: searchParams.get('status'),
    errorReason: searchParams.get('error_reason'),
    format: normalizeExportFormat(requestedFormat),
  };
}

function normalizeExportFormat(format: string | null): ErrorAnalysisExportFormat {
  return format === 'excel' ? 'excel' : 'csv';
}
