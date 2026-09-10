import { describe, expect, it } from 'vitest';

import {
  parseHeadcountWarningStatus,
  shouldKeepHeadcountWarningOpen,
} from './headcount-warning-modal-utils';

describe('headcount warning modal utilities', () => {
  it('parses headcount status totals from API error messages', () => {
    expect(parseHeadcountWarningStatus(
      'No vacant headcount available (Total: 5, Vacant: 0, Filled: 5)',
    )).toEqual({
      total: 5,
      vacant: 0,
      filled: 5,
    });
  });

  it('returns null when no headcount status summary is present', () => {
    expect(parseHeadcountWarningStatus('No vacant headcount available')).toBeNull();
  });

  it('keeps the modal open only for automatic close attempts', () => {
    expect(shouldKeepHeadcountWarningOpen(false, true)).toBe(true);
    expect(shouldKeepHeadcountWarningOpen(false, false)).toBe(false);
    expect(shouldKeepHeadcountWarningOpen(true, true)).toBe(false);
  });
});
