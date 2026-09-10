import { describe, expect, it } from 'vitest';

import { getCurrentNewApplicationsIntervalEnd } from './new-applications-current-interval';

describe('new applications current interval', () => {
  it('uses hourly intervals for single-day periods', () => {
    expect(getCurrentNewApplicationsIntervalEnd({
      intervalStart: new Date(2026, 0, 10, 13),
      periodType: 'today',
      periodUnit: 'day',
      endDate: new Date(2026, 0, 10, 23, 59, 59, 999),
    })).toEqual(new Date(2026, 0, 10, 14));
  });

  it('uses custom range granularity to choose day, week, or month ends', () => {
    expect(getCurrentNewApplicationsIntervalEnd({
      intervalStart: new Date(2026, 0, 10),
      periodType: 'custom',
      periodUnit: 'day',
      dateRange: { from: new Date(2026, 0, 1), to: new Date(2026, 0, 20) },
      endDate: new Date(2026, 0, 20),
    })).toEqual(new Date(2026, 0, 11));

    expect(getCurrentNewApplicationsIntervalEnd({
      intervalStart: new Date(2026, 0, 10),
      periodType: 'custom',
      periodUnit: 'week',
      dateRange: { from: new Date(2026, 0, 1), to: new Date(2026, 4, 1) },
      endDate: new Date(2026, 4, 1),
    })).toEqual(new Date(2026, 0, 10, 23, 59, 59, 999));

    expect(getCurrentNewApplicationsIntervalEnd({
      intervalStart: new Date(2026, 0, 10),
      periodType: 'custom',
      periodUnit: 'month',
      dateRange: { from: new Date(2026, 0, 1), to: new Date(2026, 11, 31) },
      endDate: new Date(2026, 11, 31),
    })).toEqual(new Date(2026, 0, 31, 23, 59, 59, 999));
  });

  it('maps lastN and this-period units to their expected interval ends', () => {
    expect(getCurrentNewApplicationsIntervalEnd({
      intervalStart: new Date(2026, 0, 7),
      periodType: 'lastN',
      periodUnit: 'week',
      endDate: new Date(2026, 0, 31),
    })).toEqual(new Date(2026, 0, 10, 23, 59, 59, 999));

    expect(getCurrentNewApplicationsIntervalEnd({
      intervalStart: new Date(2026, 1, 1),
      periodType: 'this',
      periodUnit: 'year',
      endDate: new Date(2026, 11, 31),
    })).toEqual(new Date(2026, 1, 28, 23, 59, 59, 999));
  });

  it('clamps intervals to the configured end date', () => {
    const endDate = new Date(2026, 0, 10, 12);

    expect(getCurrentNewApplicationsIntervalEnd({
      intervalStart: new Date(2026, 0, 10),
      periodType: 'lastN',
      periodUnit: 'day',
      endDate,
    })).toEqual(endDate);
  });
});
