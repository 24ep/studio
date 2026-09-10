import { describe, expect, it } from 'vitest';

import {
  getDefaultProcessQueueDateRange,
  getErrorAnalysisExportParams,
  getPresetProcessQueueDateRange,
  getProcessQueueDateRangeParams,
} from './process-queue-analytics-date-utils';

describe('process queue analytics date utilities', () => {
  const now = new Date('2026-06-09T12:30:00.000Z');

  function expectLocalDate(
    value: Date | undefined,
    year: number,
    monthIndex: number,
    day: number,
    hour = 0,
    minute = 0,
    second = 0,
  ) {
    expect(value?.getFullYear()).toBe(year);
    expect(value?.getMonth()).toBe(monthIndex);
    expect(value?.getDate()).toBe(day);
    expect(value?.getHours()).toBe(hour);
    expect(value?.getMinutes()).toBe(minute);
    expect(value?.getSeconds()).toBe(second);
  }

  it('builds the default 30 day range from the provided date', () => {
    const range = getDefaultProcessQueueDateRange(now);

    expectLocalDate(range.from, 2026, 4, 10);
    expect(range.to).toBe(now);
  });

  it('builds preset date ranges deterministically', () => {
    const today = getPresetProcessQueueDateRange('today', now);
    expectLocalDate(today.from, 2026, 5, 9);
    expectLocalDate(today.to, 2026, 5, 9, 23, 59, 59);

    const yesterday = getPresetProcessQueueDateRange('yesterday', now);
    expectLocalDate(yesterday.from, 2026, 5, 8);
    expectLocalDate(yesterday.to, 2026, 5, 8, 23, 59, 59);

    expectLocalDate(getPresetProcessQueueDateRange('last7days', now).from, 2026, 5, 3);
    expectLocalDate(getPresetProcessQueueDateRange('last30days', now).from, 2026, 4, 11);
    expectLocalDate(getPresetProcessQueueDateRange('thisMonth', now).from, 2026, 5, 1);

    const lastMonth = getPresetProcessQueueDateRange('lastMonth', now);
    expectLocalDate(lastMonth.from, 2026, 4, 1);
    expectLocalDate(lastMonth.to, 2026, 4, 31, 23, 59, 59);
  });

  it('falls back to the default process date bounds when a range is absent', () => {
    const params = getProcessQueueDateRangeParams(undefined, now);

    expectLocalDate(params.from, 2026, 4, 10);
    expect(params.to).toBe(now);
  });

  it('builds error analysis export params with optional filters', () => {
    const params = getErrorAnalysisExportParams({
      from: new Date('2026-06-01T00:00:00.000Z'),
      to: new Date('2026-06-09T00:00:00.000Z'),
    }, 'failed', 'API timeout');

    expect(params.get('date_start')).toBe('2026-06-01T00:00:00.000Z');
    expect(params.get('date_end')).toBe('2026-06-09T00:00:00.000Z');
    expect(params.get('status')).toBe('failed');
    expect(params.get('error_reason')).toBe('API%20timeout');
    expect(params.get('format')).toBe('csv');
  });

  it('omits all-status and empty reason export filters', () => {
    const params = getErrorAnalysisExportParams(undefined, 'all');

    expect(params.has('status')).toBe(false);
    expect(params.has('error_reason')).toBe(false);
    expect(params.get('format')).toBe('csv');
  });
});
