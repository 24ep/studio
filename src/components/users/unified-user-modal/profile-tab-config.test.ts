import { describe, expect, it } from 'vitest';

import {
  PROFILE_BASIC_FIELDS,
  PROFILE_ORGANIZATION_FIELDS,
  getProfileTextFieldValue,
} from './profile-tab-config';

describe('profile tab config', () => {
  it('defines organization and basic fields in display order', () => {
    expect(PROFILE_ORGANIZATION_FIELDS.map(field => field.name)).toEqual([
      'department',
      'positionTitle',
      'officeLocation',
    ]);
    expect(PROFILE_BASIC_FIELDS.map(field => field.name)).toEqual([
      'email',
      'phoneNumber',
    ]);
  });

  it('normalizes optional field values while preserving email values', () => {
    expect(getProfileTextFieldValue(null)).toBe('');
    expect(getProfileTextFieldValue(undefined)).toBe('');
    expect(getProfileTextFieldValue('user@example.com')).toBe('user@example.com');
  });
});
