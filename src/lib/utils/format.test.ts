import { describe, expect, it, vi } from 'vitest';

import {
  calculateDuration,
  formatDate,
  formatDateTime,
  formatFileSize,
  safeDateCompare,
  safeDateDiff,
  safeFormatDate,
  safeGetDateFromRange,
  safeGetTime,
  safeGetTimeWithFallback,
  safeToDate,
} from './format';

describe('format date utilities', () => {
  it('formats file sizes with safe fallbacks', () => {
    expect(formatFileSize(null)).toBe('Unknown size');
    expect(formatFileSize(Number.NaN)).toBe('Unknown size');
    expect(formatFileSize(-1)).toBe('Unknown size');
    expect(formatFileSize(0)).toBe('0 Bytes');
    expect(formatFileSize(1024)).toBe('1 KB');
    expect(formatFileSize(1024 * 1024 * 1.5)).toBe('1.5 MB');
  });

  it('formats display dates and rejects invalid values', () => {
    expect(formatDate('2026-06-01T00:00:00.000Z')).toBe('Jun 1, 2026');
    expect(formatDate('bad')).toBe('-');
    expect(formatDate(null)).toBe('-');
    expect(formatDateTime('bad')).toBe('-');
  });

  it('safely converts supported date inputs', () => {
    expect(safeToDate('2026-06-01')?.toISOString()).toBe('2026-06-01T00:00:00.000Z');
    expect(safeToDate(0)?.toISOString()).toBe('1970-01-01T00:00:00.000Z');
    expect(safeToDate('not-a-date')).toBeNull();
    expect(safeToDate({})).toBeNull();
  });

  it('reads date range values from broad input safely', () => {
    expect(safeGetDateFromRange({ from: '2026-06-01' }, 'from')?.toISOString()).toBe('2026-06-01T00:00:00.000Z');
    expect(safeGetDateFromRange(null, 'from')).toBeNull();
    expect(safeGetDateFromRange({ from: 'bad' }, 'from')).toBeNull();
  });

  it('formats, compares, and diffs valid dates with fallbacks', () => {
    expect(safeFormatDate('2026-06-01', 'yyyy-MM-dd')).toBe('2026-06-01');
    expect(safeFormatDate('bad', 'yyyy-MM-dd', 'fallback')).toBe('fallback');

    const start = new Date('2026-06-01T00:00:00.000Z');
    const end = new Date('2026-06-02T00:00:00.000Z');
    expect(safeDateDiff(start, end)).toBe(86_400_000);
    expect(safeDateCompare(start, end)).toBeGreaterThan(0);
    expect(safeDateCompare(start, end, false)).toBeLessThan(0);
  });

  it('returns fallback time values for invalid dates', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    expect(safeGetTimeWithFallback('bad', 42)).toBe(42);
    expect(safeGetTime('bad', 42)).toBe(42);

    warnSpy.mockRestore();
  });

  it('calculates human readable durations safely', () => {
    expect(calculateDuration('2026-01-01T10:00:00.000Z', '2026-01-01T11:05:00.000Z')).toBe('1h 5m');
    expect(calculateDuration('2026-01-01T10:00:00.000Z', '2026-01-01T10:02:03.000Z')).toBe('2m 3s');
    expect(calculateDuration('2026-01-01T10:00:00.000Z', '2026-01-01T10:00:03.000Z')).toBe('3s');
    expect(calculateDuration('bad', '2026-01-01T10:00:03.000Z')).toBe('-');
    expect(calculateDuration('2026-01-01T10:00:03.000Z', '2026-01-01T10:00:00.000Z')).toBe('-');
  });
});
