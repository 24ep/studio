import { describe, expect, it } from 'vitest';
import { buildLogsUrl, canViewLogs } from './use-application-logs-page';

describe('application logs page helpers', () => {
  it('builds log query URLs from active filters', () => {
    expect(buildLogsUrl(2, {
      level: 'ERROR',
      search: ' failed login ',
      userId: 'user-1',
      start: new Date('2026-06-01T00:00:00.000Z'),
      end: new Date('2026-06-09T00:00:00.000Z'),
    })).toBe('/api/logs?page=2&limit=20&level=ERROR&search=failed+login&actingUserId=user-1&startDate=2026-06-01T00%3A00%3A00.000Z&endDate=2026-06-09T00%3A00%3A00.000Z');
  });

  it('omits inactive filters from log query URLs', () => {
    expect(buildLogsUrl(1, {
      level: 'ALL',
      search: '   ',
      userId: 'ALL',
    })).toBe('/api/logs?page=1&limit=20');
  });

  it('allows admins and log/system-settings viewers', () => {
    expect(canViewLogs({ role: 'Admin', modulePermissions: [] })).toBe(true);
    expect(canViewLogs({ role: 'Recruiter', modulePermissions: ['LOGS_VIEW'] })).toBe(true);
    expect(canViewLogs({ role: 'Recruiter', modulePermissions: ['SYSTEM_SETTINGS_VIEW'] })).toBe(true);
    expect(canViewLogs({ role: 'Recruiter', modulePermissions: ['OTHER'] })).toBe(false);
    expect(canViewLogs(undefined)).toBe(false);
  });
});
