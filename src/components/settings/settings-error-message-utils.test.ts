import { describe, expect, it } from 'vitest';

import { getSettingsErrorMessage } from './settings-error-message-utils';

describe('settings error message utilities', () => {
  it('prefers explicit message, error, and detail messages', () => {
    expect(getSettingsErrorMessage({ message: 'Primary' }, 'Fallback')).toBe('Primary');
    expect(getSettingsErrorMessage({ error: 'Secondary' }, 'Fallback')).toBe('Secondary');
    expect(getSettingsErrorMessage({
      details: [
        'bad',
        { message: 'Detail' },
      ],
    }, 'Fallback')).toBe('Detail');
  });

  it('falls back for malformed or empty error bodies', () => {
    expect(getSettingsErrorMessage(null, 'Fallback')).toBe('Fallback');
    expect(getSettingsErrorMessage({ message: '   ', error: 123 }, 'Fallback')).toBe('Fallback');
  });
});
