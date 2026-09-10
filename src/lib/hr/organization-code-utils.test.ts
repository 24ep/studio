import { describe, expect, it } from 'vitest';

import {
  formatOrganizationRunningCode,
  getOrganizationCodePrefix,
} from './organization-code-utils';

describe('organization running codes', () => {
  it('uses the standard division prefix', () => {
    expect(getOrganizationCodePrefix('division')).toBe('DIV');
    expect(formatOrganizationRunningCode('DIV', 7)).toBe('DIV-007');
  });

  it('builds child prefixes from the selected parent code', () => {
    expect(getOrganizationCodePrefix('department', 'DIV-003')).toBe('DIV-003-DEP');
    expect(getOrganizationCodePrefix('section', 'DIV-003-DEP-002')).toBe('DIV-003-DEP-002-SEC');
    expect(getOrganizationCodePrefix('unit', ' div 003 dep 002 sec 001 '))
      .toBe('DIV-003-DEP-002-SEC-001-UNT');
  });

  it('requires a parent code for child units', () => {
    expect(() => getOrganizationCodePrefix('department', null))
      .toThrow('Select a parent before generating the department code.');
  });

  it('guards invalid sequence values', () => {
    expect(formatOrganizationRunningCode('DIV', Number.NaN)).toBe('DIV-001');
    expect(formatOrganizationRunningCode('DIV', -2)).toBe('DIV-001');
  });
});
