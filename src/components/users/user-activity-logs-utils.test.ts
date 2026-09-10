import { describe, expect, it } from 'vitest';
import {
  buildUserActivityLogsQuery,
  canGoToNextActivityPage,
  canGoToPreviousActivityPage,
  formatUserActivityLogTimestamp,
  getLogLevelBadgeVariant,
  getUserActivityLogTimestamp,
  getUserActivityTotalPages,
  hasUserActivityLogDetails,
  USER_ACTIVITY_LOGS_ITEMS_PER_PAGE,
} from './user-activity-logs-utils';

describe('user-activity-logs-utils', () => {
  it('maps log levels to badge variants', () => {
    expect(getLogLevelBadgeVariant('ERROR')).toBe('destructive');
    expect(getLogLevelBadgeVariant('WARN')).toBe('secondary');
    expect(getLogLevelBadgeVariant('AUDIT')).toBe('default');
    expect(getLogLevelBadgeVariant('INFO')).toBe('outline');
    expect(getLogLevelBadgeVariant('DEBUG')).toBe('outline');
  });

  it('formats activity timestamps with fallbacks for missing and invalid values', () => {
    expect(formatUserActivityLogTimestamp('2026-06-08T07:15:30')).toBe('Jun 08, 2026 07:15:30');
    expect(formatUserActivityLogTimestamp(undefined)).toBe('Unknown');
    expect(formatUserActivityLogTimestamp('not-a-date')).toBe('Invalid date');
  });

  it('prefers timestamp before createdAt when formatting a log', () => {
    expect(
      getUserActivityLogTimestamp({
        timestamp: '2026-06-08T07:15:30',
        createdAt: '2026-01-01T00:00:00',
      })
    ).toBe('Jun 08, 2026 07:15:30');
    expect(
      getUserActivityLogTimestamp({
        timestamp: '',
        createdAt: '2026-01-01T00:00:00',
      })
    ).toBe('Jan 01, 2026 00:00:00');
  });

  it('detects non-empty log details', () => {
    expect(hasUserActivityLogDetails({ action: 'login' })).toBe(true);
    expect(hasUserActivityLogDetails({})).toBe(false);
    expect(hasUserActivityLogDetails(null)).toBe(false);
  });

  it('calculates pagination boundaries', () => {
    expect(USER_ACTIVITY_LOGS_ITEMS_PER_PAGE).toBe(20);
    expect(getUserActivityTotalPages(0)).toBe(0);
    expect(getUserActivityTotalPages(20)).toBe(1);
    expect(getUserActivityTotalPages(21)).toBe(2);
    expect(canGoToPreviousActivityPage(1)).toBe(false);
    expect(canGoToPreviousActivityPage(2)).toBe(true);
    expect(canGoToNextActivityPage(1, 20)).toBe(false);
    expect(canGoToNextActivityPage(1, 21)).toBe(true);
  });

  it('builds the user activity log query string', () => {
    expect(
      buildUserActivityLogsQuery({
        page: 3,
        userId: 'user-123',
      })
    ).toBe('page=3&limit=20&actingUserId=user-123');
  });
});
