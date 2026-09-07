import { describe, expect, it } from 'vitest';

import {
  DEFAULT_TIME_POLICY_CONFIG,
  parseTimePolicyConfig,
  timezoneOffsetMinutesForDate,
} from './time-policy-config';

describe('parseTimePolicyConfig', () => {
  it('uses stable defaults when settings are unavailable', () => {
    expect(parseTimePolicyConfig(null)).toEqual(DEFAULT_TIME_POLICY_CONFIG);
  });

  it('applies configured workforce rules', () => {
    expect(parseTimePolicyConfig(JSON.stringify({
      timezone: 'Asia/Tokyo',
      standardWeeklyHours: 37.5,
      lateGraceMinutes: 7,
      overtimeApprovalRequired: false,
      overtimeRoundingMinutes: 30,
      minimumShiftRestHours: 12,
      holidayWorkMultiplier: 3,
    }))).toMatchObject({
      timezone: 'Asia/Tokyo',
      standardWeeklyHours: 37.5,
      lateGraceMinutes: 7,
      overtimeApprovalRequired: false,
      overtimeRoundingMinutes: 30,
      minimumShiftRestHours: 12,
      holidayWorkMultiplier: 3,
    });
  });

  it('resolves the configured IANA timezone offset for a logical work date', () => {
    expect(timezoneOffsetMinutesForDate('Asia/Bangkok', '2026-08-23')).toBe(420);
    expect(timezoneOffsetMinutesForDate('Asia/Tokyo', '2026-08-23')).toBe(540);
  });
});
