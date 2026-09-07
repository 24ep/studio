import { describe, expect, it } from 'vitest';

import {
  avatarTone,
  formatDate,
  formatListDate,
  initials,
  statusTone,
} from './ServiceDeskParts';

describe('ServiceDeskParts helpers', () => {
  it('formats participant initials safely', () => {
    expect(initials('Ada Lovelace')).toBe('AL');
    expect(initials('  Single  ')).toBe('S');
    expect(initials('')).toBe('?');
  });

  it('maps ticket statuses to stable visual tones', () => {
    expect(statusTone('closed')).toBe('good');
    expect(statusTone('resolved')).toBe('good');
    expect(statusTone('action_required')).toBe('warn');
    expect(statusTone('withdrawn')).toBe('bad');
    expect(statusTone('submitted')).toBe('neutral');
  });

  it('preserves invalid date values instead of throwing', () => {
    expect(formatDate('not-a-date', 'en-US')).toBe('not-a-date');
    expect(formatListDate('not-a-date', 'en-US')).toBe('not-a-date');
  });

  it('uses a deterministic avatar tone for the same participant', () => {
    expect(avatarTone('Ada Lovelace')).toBe(avatarTone('Ada Lovelace'));
  });
});
