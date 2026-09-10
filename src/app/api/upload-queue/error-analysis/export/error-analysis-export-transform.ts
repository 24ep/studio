import type {
  ErrorAnalysisDetailRow,
  ErrorAnalysisQueueRow,
  ErrorAnalysisSummaryRow,
} from './error-analysis-export-types';

export function buildErrorAnalysisExport(rows: ErrorAnalysisQueueRow[], exportDate: string) {
  const { errorCounts, detailsByReason } = summarizeErrorRows(rows);
  const totalJobs = rows.length;
  const totalErrors = rows.filter(item => item.error).length;
  const errorRate = formatPercentage(totalErrors, totalJobs);
  const summary = buildSummaryRows(errorCounts, totalJobs, totalErrors, errorRate, exportDate);
  const details = buildDetailRows(detailsByReason);

  return {
    summary,
    details,
    metadata: {
      totalJobs,
      totalErrors,
      errorRate,
    },
  };
}

function summarizeErrorRows(rows: ErrorAnalysisQueueRow[]) {
  const errorCounts = new Map<string, number>();
  const detailsByReason = new Map<string, ErrorAnalysisDetailRow[]>();

  rows.forEach(item => {
    if (!item.error) {
      return;
    }

    const reason = item.error_details || item.error;
    errorCounts.set(reason, (errorCounts.get(reason) || 0) + 1);

    const details = detailsByReason.get(reason) || [];
    details.push({
      'Error Reason': reason,
      'Error Category': getErrorCategory(reason),
      'File Name': item.file_name,
      'File Size (bytes)': item.file_size,
      'Status': item.status,
      'Upload Date': item.upload_date,
      'Process Date': item.process_date,
      'Completed Date': item.completed_date,
      'Position Title': item.position_title,
      'Source': item.source,
      'Error Message': item.error,
      'Error Details': item.error_details,
    });
    detailsByReason.set(reason, details);
  });

  return { errorCounts, detailsByReason };
}

function buildSummaryRows(
  errorCounts: Map<string, number>,
  totalJobs: number,
  totalErrors: number,
  errorRate: string,
  exportDate: string
): ErrorAnalysisSummaryRow[] {
  const rows = Array.from(errorCounts.entries()).map(([reason, count], index) => ({
    'No.': index + 1,
    'Error Reason': reason,
    'Error Category': getErrorCategory(reason),
    'Count': count,
    'Percentage': formatPercentage(count, totalJobs),
    'Severity': getErrorSeverity(count, totalJobs),
    'Total Jobs': totalJobs,
    'Export Date': exportDate,
  }));

  rows.push({
    'No.': 0,
    'Error Reason': 'SUMMARY',
    'Error Category': '',
    'Count': totalErrors,
    'Percentage': errorRate,
    'Severity': totalErrors > 0 ? 'high' : 'low',
    'Total Jobs': totalJobs,
    'Export Date': exportDate,
  });

  return rows;
}

function buildDetailRows(detailsByReason: Map<string, ErrorAnalysisDetailRow[]>): ErrorAnalysisDetailRow[] {
  return Array.from(detailsByReason.values()).flat();
}

function formatPercentage(count: number, totalJobs: number) {
  if (totalJobs <= 0) {
    return '0.0%';
  }

  return `${((count / totalJobs) * 100).toFixed(1)}%`;
}

export function getErrorSeverity(count: number, totalJobs: number): 'high' | 'medium' | 'low' {
  const errorRate = totalJobs > 0 ? (count / totalJobs) * 100 : 0;
  if (errorRate > 10) return 'high';
  if (errorRate > 2) return 'medium';
  return 'low';
}

export function getErrorCategory(reason: string): string {
  const normalizedReason = reason.toLowerCase();
  if (normalizedReason.includes('timeout')) return 'Timeout Error';
  if (normalizedReason.includes('connection')) return 'Network Error';
  if (normalizedReason.includes('invalid')) return 'Invalid Data Error';
  if (normalizedReason.includes('parsing')) return 'Parsing Error';
  if (normalizedReason.includes('file')) return 'File Processing Error';
  if (normalizedReason.includes('api')) return 'API Error';
  if (normalizedReason.includes('database')) return 'Database Error';
  return 'Unknown Error';
}
