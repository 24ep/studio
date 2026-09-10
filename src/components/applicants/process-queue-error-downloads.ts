import type { DateRange } from 'react-day-picker';

import { safeFetch } from '../../lib/safe-fetch';
import { getErrorAnalysisExportParams } from './process-queue-analytics-date-utils';
import {
  buildProcessQueueErrorExportRows,
  buildSingleProcessQueueErrorExportRows,
  stringifyProcessQueueErrorCsv,
  type ProcessQueueAnalyticsData,
} from './process-queue-analytics-utils';
import { downloadBlob } from './process-queue-download-utils';

interface ProcessQueueErrorDownloadOptions {
  data: ProcessQueueAnalyticsData;
  dateRange: DateRange | undefined;
  statusFilter: string;
}

export async function downloadProcessQueueErrorAnalysis({
  data,
  dateRange,
  statusFilter,
}: ProcessQueueErrorDownloadOptions) {
  const exportDate = getProcessQueueExportDate();

  try {
    const blob = await fetchProcessQueueErrorExportBlob(dateRange, statusFilter);
    downloadBlob(blob, `error-analysis-${exportDate}.csv`);
  } catch (error) {
    console.error('Error exporting error analysis:', error);
    downloadProcessQueueErrorAnalysisFallback(data, exportDate);
  }
}

export async function downloadSingleProcessQueueErrorAnalysis({
  data,
  dateRange,
  reason,
  statusFilter,
}: ProcessQueueErrorDownloadOptions & {
  reason: string;
}) {
  const exportDate = getProcessQueueExportDate();
  const exportName = getSingleProcessQueueErrorExportName(reason, exportDate);

  try {
    const blob = await fetchProcessQueueErrorExportBlob(dateRange, statusFilter, reason);
    downloadBlob(blob, exportName);
  } catch (error) {
    console.error('Error exporting single error:', error);

    const errorItem = data.stats.errorsByReason.find((item) => item.reason === reason);
    if (!errorItem) return;

    const csvContent = stringifyProcessQueueErrorCsv(
      buildSingleProcessQueueErrorExportRows(errorItem, data.stats.totalJobs, exportDate)
    );

    downloadBlob(new Blob([csvContent], { type: 'text/csv;charset=utf-8;' }), exportName);
  }
}

export function getSingleProcessQueueErrorExportName(reason: string, exportDate: string) {
  return `error-${reason.substring(0, 30).replace(/[^a-zA-Z0-9]/g, '-')}-${exportDate}.csv`;
}

async function fetchProcessQueueErrorExportBlob(
  dateRange: DateRange | undefined,
  statusFilter: string,
  reason?: string
) {
  const params = getErrorAnalysisExportParams(dateRange, statusFilter, reason);
  const result = await safeFetch(`/api/upload-queue/error-analysis/export?${params.toString()}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    timeoutMs: 15000,
  });

  if (!result.ok) {
    console.warn(
      `Skipping failed endpoint /api/upload-queue/error-analysis/export${reason ? ' (single)' : ''}:`,
      result.error || result.status
    );
    throw new Error(`Export failed: ${result.error}`);
  }

  const blob = new Blob([result.data as BlobPart], { type: 'text/csv' });
  if (blob.size === 0) {
    throw new Error('Export returned empty file');
  }

  return blob;
}

function downloadProcessQueueErrorAnalysisFallback(
  data: ProcessQueueAnalyticsData,
  exportDate: string
) {
  try {
    const csvContent = stringifyProcessQueueErrorCsv(
      buildProcessQueueErrorExportRows(data.stats.errorsByReason, data.stats.totalJobs, exportDate)
    );

    downloadBlob(new Blob([csvContent], { type: 'text/csv;charset=utf-8;' }), `error-analysis-${exportDate}.csv`);
  } catch (fallbackError) {
    console.error('Fallback export also failed:', fallbackError);
    const errors = data.stats.errorsByReason.map((item) => ({
      'Error Reason': item.reason,
      Count: item.count,
      Percentage: `${((item.count / data.stats.totalJobs) * 100).toFixed(1)}%`,
    }));

    downloadBlob(
      new Blob([JSON.stringify(errors, null, 2)], { type: 'application/json' }),
      `error-analysis-${exportDate}.json`
    );
  }
}

function getProcessQueueExportDate() {
  return new Date().toISOString().split('T')[0];
}
