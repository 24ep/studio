import type { ErrorAnalysisExportFilters } from './error-analysis-export-types';

export function buildErrorAnalysisQuery(filters: ErrorAnalysisExportFilters) {
  let query = `
    SELECT
      id,
      file_name,
      file_size,
      status,
      error,
      error_details,
      upload_date,
      process_date,
      completed_date,
      position_title,
      source
    FROM upload_queue
    WHERE 1=1
  `;
  const params: string[] = [];

  if (filters.dateStart) {
    params.push(filters.dateStart);
    query += ` AND upload_date >= $${params.length}`;
  }

  if (filters.dateEnd) {
    params.push(filters.dateEnd);
    query += ` AND upload_date <= $${params.length}`;
  }

  if (filters.status && filters.status !== 'all') {
    params.push(filters.status);
    query += ` AND status = $${params.length}`;
  }

  if (filters.errorReason) {
    params.push(decodeURIComponent(filters.errorReason));
    query += ` AND (error_details = $${params.length} OR error = $${params.length})`;
  }

  query += ' ORDER BY upload_date DESC';

  return { query, params };
}
