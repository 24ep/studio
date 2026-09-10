import type { LogEntry, UserProfile } from '@/lib/types';
import {
  getJsonArray,
  getJsonErrorMessage,
  getJsonNumber,
  getJsonString,
  getJsonObject,
  isJsonObject,
  readJsonObject,
  readJsonOrFallback,
} from '../../../lib/response-json';

import type { ApplicationLogsFilters } from './application-logs-page-types';
import { buildLogsUrl, mapLogUserOptions } from './application-logs-page-utils';

export type ApplicationLogsFetchResult =
  | { ok: true; logs: LogEntry[]; total: number }
  | { ok: false; error: string };

async function readLogsError(response: Response) {
  const errorData = await readJsonObject(response);
  const errorMessageFromServer = getJsonErrorMessage(
    errorData,
    `Failed to fetch logs: ${response.statusText || `Status ${response.status}`}`,
  );

  if (response.status === 401) {
    return errorMessageFromServer || 'Authentication required. Please refresh the page and try again.';
  }
  if (response.status === 403) {
    return 'No permission';
  }

  return errorMessageFromServer || `An unknown error occurred. Status: ${response.status}`;
}

function normalizeLogLevel(value: unknown): LogEntry['level'] {
  return value === 'INFO' || value === 'WARN' || value === 'ERROR' || value === 'DEBUG' || value === 'AUDIT'
    ? value
    : 'INFO';
}

function normalizeLogEntries(data: Awaited<ReturnType<typeof readJsonObject>>): LogEntry[] {
  return (getJsonArray(data, 'data') ?? []).flatMap((entry) => {
    if (!isJsonObject(entry)) {
      return [];
    }

    const id = getJsonString(entry, 'id');
    const timestamp = getJsonString(entry, 'timestamp');
    const message = getJsonString(entry, 'message');
    if (!id || !timestamp || !message) {
      return [];
    }

    return [{
      id,
      timestamp,
      level: normalizeLogLevel(entry.level),
      message,
      source: getJsonString(entry, 'source'),
      actingUserId: getJsonString(entry, 'actingUserId') ?? null,
      actingUserName: getJsonString(entry, 'actingUserName') ?? null,
      details: getJsonObject(entry, 'details') ?? null,
      createdAt: getJsonString(entry, 'createdAt'),
    }];
  });
}

function getLogsTotal(data: Awaited<ReturnType<typeof readJsonObject>>) {
  const pagination = getJsonObject(data, 'pagination');
  return pagination ? getJsonNumber(pagination, 'total') ?? 0 : 0;
}

function getUserListPayload(data: Awaited<ReturnType<typeof readJsonObject>> | unknown) {
  if (Array.isArray(data)) {
    return data;
  }

  if (!isJsonObject(data)) {
    return [];
  }

  return getJsonArray(data, 'users') ?? getJsonArray(data, 'data') ?? [];
}

function normalizeLogUsers(data: unknown): Array<Pick<UserProfile, 'id' | 'name'>> {
  return getUserListPayload(data).flatMap((user) => {
    if (!isJsonObject(user)) {
      return [];
    }

    const id = getJsonString(user, 'id');
    const name = getJsonString(user, 'name');
    return id && name ? [{ id, name }] : [];
  });
}

export async function fetchApplicationLogsPage(
  page: number,
  filters: ApplicationLogsFilters
): Promise<ApplicationLogsFetchResult> {
  const response = await fetch(buildLogsUrl(page, filters));

  if (!response.ok) {
    return {
      ok: false,
      error: await readLogsError(response),
    };
  }

  const data = await readJsonObject(response);
  return {
    ok: true,
    logs: normalizeLogEntries(data),
    total: getLogsTotal(data),
  };
}

export async function fetchApplicationLogUsers() {
  const response = await fetch('/api/users?pageSize=1000');
  if (!response.ok) {
    throw new Error('Failed to fetch users for log filter');
  }

  return mapLogUserOptions(normalizeLogUsers(await readJsonOrFallback<unknown>(response, [])));
}
