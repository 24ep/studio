import { describe, expect, it } from 'vitest';

import {
  groupValidationErrors,
  validationUtils,
} from './form-validation-utils';

describe('form validation utilities', () => {
  it('groups missing validation types as errors', () => {
    expect(groupValidationErrors([
      { field: 'name', message: 'Required' },
      { field: 'age', message: 'Check value', type: 'warning' },
      { field: 'note', message: 'Helpful text', type: 'info' },
    ])).toEqual({
      error: [{ field: 'name', message: 'Required' }],
      warning: [{ field: 'age', message: 'Check value', type: 'warning' }],
      info: [{ field: 'note', message: 'Helpful text', type: 'info' }],
    });
  });

  it('validates common primitive field constraints', () => {
    expect(validationUtils.isValidEmail('person@example.com')).toBe(true);
    expect(validationUtils.isValidEmail('person')).toBe(false);
    expect(validationUtils.isRequired('  value  ')).toBe(true);
    expect(validationUtils.isRequired('   ')).toBe(false);
    expect(validationUtils.isInRange(5, 1, 10)).toBe(true);
    expect(validationUtils.isInRange(11, 1, 10)).toBe(false);
  });
});
