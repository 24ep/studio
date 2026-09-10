import { getJsonArray, getJsonNumber, getJsonObject, getJsonString, isJsonObject, readJsonObject } from '@/lib/response-json';
import type { LogEntry } from '@/lib/types';

import { buildUserActivityLogsQuery } from './user-activity-logs-utils';

export interface UserActivityLogsResult {
  logs: LogEntry[];
  total: number;
}

export async function fetchUserActivityLogs({
  page,
  userId,
}: {
  page: number;
  userId: string;
}): Promise<UserActivityLogsResult> {
  const queryParams = buildUserActivityLogsQuery({ page, userId });
  const response = await fetch(`/api/logs?${queryParams}`);

  if (!response.ok) {
    throw new Error('Failed to fetch logs');
  }

  const data = await readJsonObject(response);
  const pagination = getJsonObject(data, 'pagination') ?? {};

  return {
    logs: normalizeUserActivityLogs(getJsonArray(data, 'data') ?? []),
    total: getJsonNumber(pagination, 'total') ?? 0,
  };
}

function normalizeUserActivityLogs(rows: unknown[]): LogEntry[] {
  return rows
    .filter(isJsonObject)
    .map((row) => ({
      ...row,
      id: getJsonString(row, 'id') || '',
      level: getJsonString(row, 'level') || 'INFO',
      message: getJsonString(row, 'message') || '',
      timestamp: row.timestamp,
      createdAt: row.createdAt,
      source: getJsonString(row, 'source') || undefined,
      details: row.details,
    } as LogEntry))
    .filter((log) => log.id && log.message);
}
