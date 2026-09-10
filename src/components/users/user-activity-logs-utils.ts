import { format } from 'date-fns';
import parseISO from 'date-fns/parseISO';
import type { LogEntry, LogLevel } from '@/lib/types';

export const USER_ACTIVITY_LOGS_ITEMS_PER_PAGE = 20;

export function getLogLevelBadgeVariant(
  level: LogLevel
): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (level) {
    case 'ERROR':
      return 'destructive';
    case 'WARN':
      return 'secondary';
    case 'AUDIT':
      return 'default';
    case 'INFO':
    case 'DEBUG':
    default:
      return 'outline';
  }
}

export function formatUserActivityLogTimestamp(
  timestamp: LogEntry['timestamp'] | LogEntry['createdAt']
) {
  if (!timestamp) return 'Unknown';

  try {
    const date = typeof timestamp === 'string' ? parseISO(timestamp) : new Date(timestamp);
    return format(date, 'MMM dd, yyyy HH:mm:ss');
  } catch {
    return 'Invalid date';
  }
}

export function getUserActivityLogTimestamp(log: Pick<LogEntry, 'timestamp' | 'createdAt'>) {
  return formatUserActivityLogTimestamp(log.timestamp || log.createdAt);
}

export function hasUserActivityLogDetails(details: LogEntry['details']) {
  return !!details && typeof details === 'object' && Object.keys(details).length > 0;
}

export function getUserActivityTotalPages(
  totalLogs: number,
  itemsPerPage = USER_ACTIVITY_LOGS_ITEMS_PER_PAGE
) {
  return Math.ceil(totalLogs / itemsPerPage);
}

export function canGoToPreviousActivityPage(currentPage: number) {
  return currentPage > 1;
}

export function canGoToNextActivityPage(currentPage: number, totalLogs: number) {
  return currentPage < getUserActivityTotalPages(totalLogs);
}

export function buildUserActivityLogsQuery({
  page,
  userId,
  itemsPerPage = USER_ACTIVITY_LOGS_ITEMS_PER_PAGE,
}: {
  page: number;
  userId: string;
  itemsPerPage?: number;
}) {
  return new URLSearchParams({
    page: page.toString(),
    limit: itemsPerPage.toString(),
    actingUserId: userId,
  }).toString();
}
