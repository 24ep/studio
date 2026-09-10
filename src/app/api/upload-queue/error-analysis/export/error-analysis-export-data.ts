import { getPool } from '@/lib/db';
import type { ErrorAnalysisExportFilters, ErrorAnalysisQueueRow } from './error-analysis-export-types';
import { buildErrorAnalysisQuery } from './error-analysis-export-query';

export async function fetchErrorAnalysisRows(filters: ErrorAnalysisExportFilters): Promise<ErrorAnalysisQueueRow[]> {
  const { query, params } = buildErrorAnalysisQuery(filters);
  const result = await getPool().query(query, params);
  return result.rows;
}
