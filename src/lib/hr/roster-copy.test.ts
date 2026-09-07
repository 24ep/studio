import { describe, expect, it } from 'vitest';

import { rosterCopyIdempotencyKey, rosterCopyTargetDate } from './roster-copy';

describe('rosterCopyTargetDate', () => {
  it('keeps weekday offsets when copying a week', () => {
    expect(rosterCopyTargetDate('2026-08-19', '2026-08-17', '2026-08-24')).toBe('2026-08-26');
  });

  it('creates a stable copy key', () => {
    expect(rosterCopyIdempotencyKey('assignment-1', '2026-08-24')).toBe('roster-copy:assignment-1:2026-08-24');
  });
});
