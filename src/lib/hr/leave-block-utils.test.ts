import { describe, expect, it } from 'vitest';

import { getLeaveBlockValidationError } from './leave-block-utils';

describe('leave block validation', () => {
  it('accepts a valid all-employee date range', () => {
    expect(getLeaveBlockValidationError({
      startDate: '2026-12-20',
      endDate: '2026-12-31',
      scope: 'all',
    })).toBeNull();
  });

  it('rejects an inverted date range', () => {
    expect(getLeaveBlockValidationError({
      startDate: '2026-12-31',
      endDate: '2026-12-20',
      scope: 'all',
    })).toBe('End date must be on or after start date');
  });

  it('requires a target for department and location scopes', () => {
    expect(getLeaveBlockValidationError({
      startDate: '2026-12-20',
      endDate: '2026-12-31',
      scope: 'department',
      targetValue: '',
    })).toBe('Target department is required');
  });
});
