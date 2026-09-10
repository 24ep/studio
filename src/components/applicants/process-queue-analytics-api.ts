import type { DateRange } from 'react-day-picker';

import { safeFetch } from '../../lib/safe-fetch';
import { getProcessQueueDateRangeParams } from './process-queue-analytics-date-utils';
import {
  buildEmptyProcessQueueAnalytics,
  normalizeProcessQueueListResponse,
  processQueueAnalyticsData,
  type ProcessQueueAnalyticsData,
  type ProcessQueueListResponse,
} from './process-queue-analytics-utils';

export async function fetchProcessQueueAnalyticsData({
  dateRange,
  statusFilter,
}: {
  dateRange: DateRange | undefined;
  statusFilter: string;
}): Promise<ProcessQueueAnalyticsData> {
  const params = new URLSearchParams({ limit: '1000' });
  const { from, to } = getProcessQueueDateRangeParams(dateRange);

  params.append('process_date_start', from.toISOString());
  params.append('process_date_end', to.toISOString());

  if (statusFilter && statusFilter !== 'all') {
    params.append('status', statusFilter);
  }

  const result = await safeFetch<ProcessQueueListResponse>(`/api/upload-queue?${params}`, { timeoutMs: 10000 });
  if (!result.ok) {
    console.warn('Skipping failed endpoint /api/upload-queue:', result.error || result.status);
    return buildEmptyProcessQueueAnalytics();
  }

  const { queueData, totalJobs } = normalizeProcessQueueListResponse(result.data);
  return processQueueAnalyticsData(queueData, totalJobs);
}
