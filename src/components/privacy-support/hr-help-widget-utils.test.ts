import { describe, expect, it } from 'vitest';
import {
  buildHrWidgetSubject,
  hasEnoughHrWidgetMessageDetail,
  normalizeHrWidgetMessage,
} from './hr-help-widget-utils';

describe('HR help widget message helpers', () => {
  it('normalizes blank lines and repeated whitespace', () => {
    expect(normalizeHrWidgetMessage('\n  I need   help with payroll.  ')).toBe('I need help with payroll.');
  });

  it('requires ten meaningful characters before submission', () => {
    expect(hasEnoughHrWidgetMessageDetail('help me')).toBe(false);
    expect(hasEnoughHrWidgetMessageDetail('help me please')).toBe(true);
    expect(hasEnoughHrWidgetMessageDetail('a          b')).toBe(false);
  });

  it('builds a valid subject when a message begins with blank lines', () => {
    expect(buildHrWidgetSubject('\n\nI need help with my leave request.')).toBe('I need help with my leave request.');
  });

  it('limits generated subjects to 76 characters', () => {
    expect(buildHrWidgetSubject('A'.repeat(100))).toBe(`${'A'.repeat(73)}...`);
  });
});
