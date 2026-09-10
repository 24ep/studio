import type { LogLevel, UserProfile } from '@/lib/types';

import {
  APPLICATION_LOGS_PAGE_SIZE,
  type ApplicationLogsFilters,
  type LogUserOption,
} from './application-logs-page-types';

export function buildLogsUrl(page: number, filters: ApplicationLogsFilters) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(APPLICATION_LOGS_PAGE_SIZE),
  });

  if (filters.level !== 'ALL') params.set('level', filters.level);
  if (filters.search.trim()) params.set('search', filters.search.trim());
  if (filters.userId !== 'ALL') params.set('actingUserId', filters.userId);
  if (filters.start) params.set('startDate', filters.start.toISOString());
  if (filters.end) params.set('endDate', filters.end.toISOString());

  return `/api/logs?${params.toString()}`;
}

export function canViewLogs(user: { role?: string; modulePermissions?: string[] } | undefined) {
  return Boolean(
    user?.role === 'Admin' ||
    user?.modulePermissions?.includes('LOGS_VIEW') ||
    user?.modulePermissions?.includes('SYSTEM_SETTINGS_VIEW')
  );
}

export function getDefaultApplicationLogsFilters(): ApplicationLogsFilters {
  return {
    level: 'ALL' as LogLevel | 'ALL',
    search: '',
    userId: 'ALL',
    start: undefined,
    end: undefined,
  };
}

export function mapLogUserOptions(users: Array<Pick<UserProfile, 'id' | 'name'>>): LogUserOption[] {
  return users.map((user) => ({ id: user.id, name: user.name }));
}

export function filterLogUserOptions(users: LogUserOption[], search: string) {
  const normalizedSearch = search.toLowerCase();
  return users.filter((user) => user.name.toLowerCase().includes(normalizedSearch));
}
