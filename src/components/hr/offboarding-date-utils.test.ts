import { describe, expect, it } from 'vitest';

import { offboardingDateLabel, offboardingDaysRemaining, parseLifecycleDate } from './offboarding-date-utils';

describe('offboarding date utilities', () => {
  it('accepts both date-only and ISO timestamp values', () => {
    expect(parseLifecycleDate('2026-08-31')).not.toBeNull();
    expect(parseLifecycleDate('2026-08-31T00:00:00.000Z')).not.toBeNull();
  });

  it('returns safe states for missing and malformed values', () => {
    expect(parseLifecycleDate('not-a-date')).toBeNull();
    expect(offboardingDateLabel('not-a-date', 'en-US')).toBe('Date required');
    expect(offboardingDaysRemaining('not-a-date')).toBeNull();
  });

  it('returns a finite day count', () => {
    expect(offboardingDaysRemaining('2026-08-31', new Date('2026-08-13T12:00:00Z'))).toBe(19);
  });
});
