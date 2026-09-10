import { describe, expect, it } from 'vitest';

import {
  buildEmptyProcessQueueAnalytics,
  buildProcessQueueErrorExportRows,
  buildSingleProcessQueueErrorExportRows,
  getProcessQueueErrorCategory,
  getProcessQueueErrorSeverity,
  normalizeProcessQueueListResponse,
  processQueueAnalyticsData,
  stringifyProcessQueueErrorCsv,
  type ProcessQueueItem,
} from './process-queue-analytics-utils';
import {
  buildProcessQueueErrorAnalysisSummary,
  formatProcessQueueErrorReasonPreview,
} from './process-queue-error-analysis-utils';
import {
  getSingleProcessQueueErrorExportName,
} from './process-queue-error-downloads';
import {
  buildProcessQueueScatterDataset,
  getProcessQueuePointColor,
} from './process-queue-scatter-utils';

function hasOverride(overrides: Partial<ProcessQueueItem>, key: keyof ProcessQueueItem) {
  return Object.prototype.hasOwnProperty.call(overrides, key);
}

function makeQueueItem(overrides: Partial<ProcessQueueItem>): ProcessQueueItem {
  return {
    id: overrides.id || 'queue-item',
    file_name: overrides.file_name || 'resume.pdf',
    file_size: overrides.file_size ?? 1024 * 1024,
    status: overrides.status || 'success',
    upload_date: overrides.upload_date || '2026-01-01T09:00:00.000Z',
    process_date: hasOverride(overrides, 'process_date') ? overrides.process_date! : '2026-01-01T10:00:00.000Z',
    completed_date: hasOverride(overrides, 'completed_date') ? overrides.completed_date! : '2026-01-01T10:30:00.000Z',
    error: hasOverride(overrides, 'error') ? overrides.error! : null,
    error_details: hasOverride(overrides, 'error_details') ? overrides.error_details! : null,
    position_title: hasOverride(overrides, 'position_title') ? overrides.position_title! : null,
    source: hasOverride(overrides, 'source') ? overrides.source! : 'manual',
    source_id: hasOverride(overrides, 'source_id') ? overrides.source_id! : 'source-1',
    source_name: hasOverride(overrides, 'source_name') ? overrides.source_name! : 'Manual Upload',
    source_logo: hasOverride(overrides, 'source_logo') ? overrides.source_logo! : null,
  };
}

describe('process queue analytics utilities', () => {
  it('builds empty analytics data', () => {
    expect(buildEmptyProcessQueueAnalytics(12)).toEqual({
      scatterData: [],
      stats: {
        totalJobs: 12,
        avgDuration: 0,
        avgDurationByType: [],
        jobsByType: [],
        errorsByReason: [],
        fileSizeRanges: [],
        sourceAnalytics: [],
      },
    });
  });

  it('normalizes queue list responses with safe defaults', () => {
    const item = makeQueueItem({ id: 'normal' });

    expect(normalizeProcessQueueListResponse({ data: [item], total: 42 })).toEqual({
      queueData: [item],
      totalJobs: 42,
    });
    expect(normalizeProcessQueueListResponse({ data: [item], total: null })).toEqual({
      queueData: [item],
      totalJobs: 1,
    });
    expect(normalizeProcessQueueListResponse(null)).toEqual({
      queueData: [],
      totalJobs: 0,
    });
  });

  it('aggregates durations, file sizes, errors, statuses, and sources', () => {
    const analytics = processQueueAnalyticsData([
      makeQueueItem({
        id: 'a',
        file_size: 512 * 1024,
        process_date: '2026-01-01T10:00:00.000Z',
        completed_date: '2026-01-01T10:30:00.000Z',
      }),
      makeQueueItem({
        id: 'b',
        status: 'failed',
        file_size: 6 * 1024 * 1024,
        process_date: '2026-01-01T11:00:00.000Z',
        completed_date: '2026-01-01T12:00:00.000Z',
        error: 'timeout',
        error_details: 'API timeout',
        source_id: 'source-2',
        source_name: 'API',
      }),
      makeQueueItem({
        id: 'queued',
        status: 'queued',
        process_date: null,
        completed_date: null,
      }),
    ], 99);

    expect(analytics.stats.totalJobs).toBe(99);
    expect(analytics.scatterData.map(item => item.id)).toEqual(['a', 'b']);
    expect(analytics.stats.avgDuration).toBe(45);
    expect(analytics.stats.jobsByType).toEqual([
      { type: 'success', count: 1 },
      { type: 'failed', count: 1 },
      { type: 'queued', count: 1 },
    ]);
    expect(analytics.stats.avgDurationByType).toEqual([
      { type: 'success', avgDuration: 30, count: 1 },
      { type: 'failed', avgDuration: 60, count: 1 },
      { type: 'queued', avgDuration: 0, count: 1 },
    ]);
    expect(analytics.stats.errorsByReason).toEqual([
      { reason: 'API timeout', count: 1 },
    ]);
    expect(analytics.stats.fileSizeRanges).toEqual([
      { range: '< 1MB', count: 1, avgDuration: 30 },
      { range: '5-10MB', count: 1, avgDuration: 60 },
    ]);
    expect(analytics.stats.sourceAnalytics.map(source => ({
      sourceName: source.sourceName,
      totalJobs: source.totalJobs,
      successJobs: source.successJobs,
      failedJobs: source.failedJobs,
      successRate: source.successRate,
      failedRate: source.failedRate,
      avgDuration: source.avgDuration,
    }))).toEqual([
      {
        sourceName: 'Manual Upload',
        totalJobs: 2,
        successJobs: 1,
        failedJobs: 0,
        successRate: 50,
        failedRate: 0,
        avgDuration: 30,
      },
      {
        sourceName: 'API',
        totalJobs: 1,
        successJobs: 0,
        failedJobs: 1,
        successRate: 0,
        failedRate: 100,
        avgDuration: 60,
      },
    ]);
  });

  it('groups file size ranges and unknown sources consistently', () => {
    const analytics = processQueueAnalyticsData([
      makeQueueItem({
        id: 'one-mb',
        file_size: 1024 * 1024,
        process_date: '2026-01-01T10:00:00.000Z',
        completed_date: '2026-01-01T10:10:00.000Z',
        source: null,
        source_id: null,
        source_name: null,
      }),
      makeQueueItem({
        id: 'ten-mb',
        file_size: 10 * 1024 * 1024,
        process_date: '2026-01-01T11:00:00.000Z',
        completed_date: '2026-01-01T11:20:00.000Z',
        source: null,
        source_id: null,
        source_name: null,
      }),
    ], 2);

    expect(analytics.stats.fileSizeRanges).toEqual([
      { range: '1-5MB', count: 1, avgDuration: 10 },
      { range: '> 10MB', count: 1, avgDuration: 20 },
    ]);
    expect(analytics.stats.sourceAnalytics).toEqual([{
      sourceId: null,
      sourceName: 'Unknown Source',
      sourceLogo: null,
      totalJobs: 2,
      successJobs: 2,
      failedJobs: 0,
      successRate: 100,
      failedRate: 0,
      avgDuration: 15,
      totalDuration: 30,
    }]);
  });

  it('skips items with invalid completed dates like the component did before extraction', () => {
    const analytics = processQueueAnalyticsData([
      makeQueueItem({
        id: 'bad',
        process_date: 'bad-date',
        completed_date: '2026-01-01T10:00:00.000Z',
        error: 'invalid file',
      }),
      makeQueueItem({ id: 'good' }),
    ], 2);

    expect(analytics.scatterData.map(item => item.id)).toEqual(['good']);
    expect(analytics.stats.jobsByType).toEqual([{ type: 'success', count: 1 }]);
    expect(analytics.stats.errorsByReason).toEqual([]);
  });

  it('classifies error severity and category', () => {
    expect(getProcessQueueErrorSeverity(11, 100)).toBe('high');
    expect(getProcessQueueErrorSeverity(3, 100)).toBe('medium');
    expect(getProcessQueueErrorSeverity(1, 100)).toBe('low');
    expect(getProcessQueueErrorSeverity(1, 0)).toBe('low');

    expect(getProcessQueueErrorCategory('connection dropped')).toBe('Network Error');
    expect(getProcessQueueErrorCategory('INVALID format')).toBe('Invalid Data Error');
    expect(getProcessQueueErrorCategory('database unavailable')).toBe('Database Error');
    expect(getProcessQueueErrorCategory('something else')).toBe('Unknown Error');
  });

  it('builds error export rows with summary and safe percentages', () => {
    const rows = buildProcessQueueErrorExportRows([
      { reason: 'API timeout', count: 3 },
      { reason: 'invalid file', count: 1 },
    ], 20, '2026-06-06');

    expect(rows).toEqual([
      {
        'No.': 1,
        'Error Reason': 'API timeout',
        'Error Category': 'Timeout Error',
        Count: 3,
        Percentage: '15.0%',
        Severity: 'high',
        'Total Jobs': 20,
        'Export Date': '2026-06-06',
      },
      {
        'No.': 2,
        'Error Reason': 'invalid file',
        'Error Category': 'Invalid Data Error',
        Count: 1,
        Percentage: '5.0%',
        Severity: 'medium',
        'Total Jobs': 20,
        'Export Date': '2026-06-06',
      },
      {
        'No.': '',
        'Error Reason': 'SUMMARY',
        'Error Category': '',
        Count: 4,
        Percentage: '20.0%',
        Severity: 'high',
        'Total Jobs': 20,
        'Export Date': '2026-06-06',
      },
    ]);

    expect(buildProcessQueueErrorExportRows([
      { reason: 'database unavailable', count: 1 },
    ], 0, '2026-06-06')[0].Percentage).toBe('0.0%');
  });

  it('builds error analysis display summary and previews', () => {
    expect(buildProcessQueueErrorAnalysisSummary([
      { reason: 'timeout', count: 3 },
      { reason: 'invalid file', count: 1 },
    ], 20)).toEqual({
      totalErrors: 4,
      errorTypes: 2,
      errorRate: '20.0%',
    });

    expect(buildProcessQueueErrorAnalysisSummary([{ reason: 'timeout', count: 1 }], 0).errorRate).toBe('0.0%');

    expect(formatProcessQueueErrorReasonPreview('short reason')).toBe('short reason');
    expect(formatProcessQueueErrorReasonPreview('x'.repeat(81))).toBe(`${'x'.repeat(80)}...`);
  });

  it('builds scatter chart colors and dataset values', () => {
    expect(getProcessQueuePointColor('success', '0.8')).toBe('rgba(34, 197, 94, 0.8)');
    expect(getProcessQueuePointColor('failed', '1')).toBe('rgba(239, 68, 68, 1)');
    expect(getProcessQueuePointColor('inprocess', '1')).toBe('rgba(234, 179, 8, 1)');
    expect(getProcessQueuePointColor('queued', '1')).toBe('rgba(59, 130, 246, 1)');
    expect(getProcessQueuePointColor('unknown', '1')).toBe('rgba(107, 114, 128, 1)');

    const dataset = buildProcessQueueScatterDataset({
      scatterData: [{
        id: 'job-1',
        x: '2026-01-01T10:00:00.000Z',
        y: 30,
        status: 'success',
        fileName: 'resume.pdf',
        fileSize: 1024,
        uploadDate: '2026-01-01T09:00:00.000Z',
        processDate: '2026-01-01T10:00:00.000Z',
        completedDate: '2026-01-01T10:30:00.000Z',
        error: null,
        errorDetails: null,
        positionTitle: null,
        source: 'manual',
        source_logo: null,
      }],
      stats: buildEmptyProcessQueueAnalytics(1).stats,
    });

    expect(dataset.datasets[0]).toMatchObject({
      label: 'Duration (minutes)',
      backgroundColor: ['rgba(34, 197, 94, 0.8)'],
      borderColor: ['rgba(34, 197, 94, 1)'],
    });
    expect(dataset.datasets[0].data[0].y).toBe(30);
  });

  it('builds single error export rows and escapes CSV values', () => {
    const rows = buildSingleProcessQueueErrorExportRows(
      { reason: 'invalid "quoted" file', count: 2 },
      10,
      '2026-06-06'
    );

    expect(rows).toEqual([{
      'Error Reason': 'invalid "quoted" file',
      'Error Category': 'Invalid Data Error',
      Count: 2,
      Percentage: '20.0%',
      Severity: 'high',
      'Total Jobs': 10,
      'Export Date': '2026-06-06',
    }]);

    expect(stringifyProcessQueueErrorCsv(rows)).toContain('"invalid ""quoted"" file"');
    expect(getSingleProcessQueueErrorExportName('invalid "quoted" file', '2026-06-06'))
      .toBe('error-invalid--quoted--file-2026-06-06.csv');
  });
});
