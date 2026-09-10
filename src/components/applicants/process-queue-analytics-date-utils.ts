import type { DateRange } from 'react-day-picker';

import { safeGetDateFromRange } from '../../lib/utils/format';

export type ProcessQueueDatePreset = 'today' | 'yesterday' | 'last7days' | 'last30days' | 'thisMonth' | 'lastMonth';

export function getDefaultProcessQueueDateRange(now = new Date()): DateRange {
  const thirtyDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
  return { from: thirtyDaysAgo, to: now };
}

export function getPresetProcessQueueDateRange(
  preset: ProcessQueueDatePreset,
  now = new Date(),
): DateRange {
  switch (preset) {
    case 'today':
      return {
        from: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
        to: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59),
      };
    case 'yesterday':
      return {
        from: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1),
        to: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59),
      };
    case 'last7days':
      return {
        from: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6),
        to: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59),
      };
    case 'last30days':
      return {
        from: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29),
        to: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59),
      };
    case 'thisMonth':
      return {
        from: new Date(now.getFullYear(), now.getMonth(), 1),
        to: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59),
      };
    case 'lastMonth':
      return {
        from: new Date(now.getFullYear(), now.getMonth() - 1, 1),
        to: new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59),
      };
  }
}

export function appendProcessQueueExportDateRangeParams(
  params: URLSearchParams,
  dateRange: DateRange | undefined,
) {
  const fromDate = safeGetDateFromRange(dateRange, 'from');
  const toDate = safeGetDateFromRange(dateRange, 'to');

  if (fromDate) {
    params.append('date_start', fromDate.toISOString());
  }
  if (toDate) {
    params.append('date_end', toDate.toISOString());
  }
}

export function getProcessQueueDateRangeParams(
  dateRange: DateRange | undefined,
  now = new Date(),
) {
  return {
    from: safeGetDateFromRange(dateRange, 'from') || new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30),
    to: safeGetDateFromRange(dateRange, 'to') || now,
  };
}

export function getErrorAnalysisExportParams(
  dateRange: DateRange | undefined,
  statusFilter: string,
  reason?: string,
) {
  const params = new URLSearchParams();
  appendProcessQueueExportDateRangeParams(params, dateRange);

  if (statusFilter && statusFilter !== 'all') {
    params.append('status', statusFilter);
  }
  if (reason) {
    params.append('error_reason', encodeURIComponent(reason));
  }

  params.append('format', 'csv');
  return params;
}
