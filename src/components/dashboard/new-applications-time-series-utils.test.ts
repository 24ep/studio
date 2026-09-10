import { describe, expect, it } from 'vitest';
import type { Applicant } from '@/lib/types';

import {
  buildNewApplicationsChartData,
  calculateAverageApplications,
  countNewApplicationsInPeriod,
  createDefaultNewApplicationsDateRange,
  getNewApplicationsPeriodConfig,
} from './new-applications-time-series-utils';

function applicant(applicationDate: string): Applicant {
  return { id: applicationDate, applicationDate } as Applicant;
}

describe('new-applications-time-series-utils', () => {
  it('creates the default seven-day date range', () => {
    const now = new Date(2026, 0, 10, 12);

    expect(createDefaultNewApplicationsDateRange(now)).toEqual({
      from: new Date(2026, 0, 3, 12),
      to: now,
    });
  });

  it('builds hourly intervals for today', () => {
    const config = getNewApplicationsPeriodConfig({
      periodType: 'today',
      periodUnit: 'day',
      periodN: 1,
      now: new Date(2026, 0, 10, 12),
    });

    const intervals = config.intervalFunction({ start: config.startDate, end: config.endDate });
    expect(config.startDate).toEqual(new Date(2026, 0, 10, 0, 0, 0, 0));
    expect(config.endDate).toEqual(new Date(2026, 0, 10, 23, 59, 59, 999));
    expect(intervals).toHaveLength(24);
    expect(config.formatFunction(intervals[13])).toBe('13:00');
  });

  it('uses compatible initial daily data when provided', () => {
    const periodConfig = getNewApplicationsPeriodConfig({
      periodType: 'lastN',
      periodUnit: 'day',
      periodN: 2,
      now: new Date(2026, 0, 10, 12),
    });

    const chartData = buildNewApplicationsChartData({
      applicants: [],
      initialData: [
        { date: '2026-01-10', count: 3 },
        { date: '2026-01-08', count: 1 },
        { date: '2026-01-01', count: 99 },
      ],
      periodType: 'lastN',
      periodUnit: 'day',
      periodN: 2,
      periodConfig,
    });

    expect(chartData.labels).toEqual(['Jan 08', 'Jan 10']);
    expect(chartData.datasets[0].data).toEqual([1, 3]);
    expect(chartData.datasets[0].label).toBe('New Applications');
  });

  it('buckets applicant application dates into the selected period', () => {
    const periodConfig = getNewApplicationsPeriodConfig({
      periodType: 'lastN',
      periodUnit: 'day',
      periodN: 2,
      now: new Date(2026, 0, 10, 12),
    });

    const chartData = buildNewApplicationsChartData({
      applicants: [
        applicant('2026-01-08T12:00:00.000Z'),
        applicant('2026-01-09T12:00:00.000Z'),
        applicant('2026-01-09T16:00:00.000Z'),
        applicant('2025-12-31T12:00:00.000Z'),
      ],
      periodType: 'lastN',
      periodUnit: 'day',
      periodN: 2,
      periodConfig,
    });

    expect(chartData.labels).toEqual(['Jan 08', 'Jan 09', 'Jan 10']);
    expect(chartData.datasets[0].data).toEqual([1, 2, 0]);
    expect(chartData.datasets[0].label).toBe('Current');
  });

  it('counts and averages application data defensively', () => {
    const applicants = [
      applicant('2026-01-08T12:00:00.000Z'),
      applicant('2026-01-09T12:00:00.000Z'),
      { id: 'bad-date', applicationDate: 'not-a-date' } as Applicant,
    ];

    expect(countNewApplicationsInPeriod(
      applicants,
      new Date('2026-01-08T00:00:00.000Z'),
      new Date('2026-01-09T23:59:59.999Z')
    )).toBe(2);

    expect(calculateAverageApplications({
      labels: ['Jan 08', 'Jan 09'],
      datasets: [{ data: [1, 3] }],
    })).toBe(2);
    expect(calculateAverageApplications({ labels: [], datasets: [] })).toBe(0);
  });
});
