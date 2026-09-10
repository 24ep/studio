import { describe, expect, it } from 'vitest';
import { buildErrorAnalysisQuery } from './error-analysis-export-query';
import { buildErrorAnalysisExport, getErrorCategory, getErrorSeverity } from './error-analysis-export-transform';
import { stringifyErrorAnalysisCsv } from './error-analysis-export-csv';
import type { ErrorAnalysisQueueRow } from './error-analysis-export-types';

const baseFilters = {
  dateStart: null,
  dateEnd: null,
  status: null,
  errorReason: null,
  format: 'csv' as const,
};

function makeQueueRow(overrides: Partial<ErrorAnalysisQueueRow>): ErrorAnalysisQueueRow {
  return {
    id: 'job-1',
    file_name: 'resume.pdf',
    file_size: 1024,
    status: 'failed',
    error: 'Timeout while processing',
    error_details: null,
    upload_date: '2026-01-01T00:00:00.000Z',
    process_date: null,
    completed_date: null,
    position_title: 'Engineer',
    source: 'upload',
    ...overrides,
  };
}

describe('error-analysis-export utils', () => {
  it('builds parameterized filter queries in order', () => {
    const query = buildErrorAnalysisQuery({
      ...baseFilters,
      dateStart: '2026-01-01',
      dateEnd: '2026-01-31',
      status: 'failed',
      errorReason: encodeURIComponent('API timeout'),
    });

    expect(query.params).toEqual(['2026-01-01', '2026-01-31', 'failed', 'API timeout']);
    expect(query.query).toContain('upload_date >= $1');
    expect(query.query).toContain('upload_date <= $2');
    expect(query.query).toContain('status = $3');
    expect(query.query).toContain('(error_details = $4 OR error = $4)');
  });

  it('summarizes errors and appends a summary row', () => {
    const exportData = buildErrorAnalysisExport([
      makeQueueRow({ id: 'job-1', error: 'Timeout while processing' }),
      makeQueueRow({ id: 'job-2', error: 'Timeout while processing' }),
      makeQueueRow({ id: 'job-3', status: 'success', error: null }),
    ], '2026-02-01');

    expect(exportData.summary).toEqual([
      expect.objectContaining({
        'No.': 1,
        'Error Reason': 'Timeout while processing',
        'Count': 2,
        'Percentage': '66.7%',
        'Severity': 'high',
      }),
      expect.objectContaining({
        'No.': 0,
        'Error Reason': 'SUMMARY',
        'Count': 2,
        'Percentage': '66.7%',
      }),
    ]);
    expect(exportData.details).toHaveLength(2);
    expect(exportData.metadata).toEqual({
      totalJobs: 3,
      totalErrors: 2,
      errorRate: '66.7%',
    });
  });

  it('categorizes errors case-insensitively and formats CSV values safely', () => {
    expect(getErrorCategory('DATABASE CONNECTION timeout')).toBe('Timeout Error');
    expect(getErrorSeverity(1, 100)).toBe('low');
    expect(stringifyErrorAnalysisCsv([{
      'No.': 1,
      'Error Reason': 'Bad "quoted" value',
      'Error Category': 'Invalid Data Error',
      'Count': 1,
      'Percentage': '100.0%',
      'Severity': 'high',
      'Total Jobs': 1,
      'Export Date': '2026-02-01',
    }])).toContain('"Bad ""quoted"" value"');
  });
});
