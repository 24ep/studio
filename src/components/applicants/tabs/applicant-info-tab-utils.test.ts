import { describe, expect, it } from 'vitest';

import {
  composeApplicantInfoFullName,
  getApplicantInfoFormErrorMessage,
  getApplicantInfoFieldValue,
  getApplicantPersonalInfo,
} from './applicant-info-tab-utils';

describe('applicant info tab utilities', () => {
  it('reads personal info from object parsed data', () => {
    const personalInfo = { firstname: 'Ada', lastname: 'Lovelace' };

    expect(getApplicantPersonalInfo({ personal_info: personalInfo })).toBe(personalInfo);
    expect(getApplicantPersonalInfo({ personal_info: [] })).toBeUndefined();
    expect(getApplicantPersonalInfo({})).toBeUndefined();
  });

  it('reads personal info from JSON parsed data strings', () => {
    expect(getApplicantPersonalInfo(JSON.stringify({
      personal_info: {
        nickname: 'Grace',
        location: 'Bangkok',
      },
    }))).toEqual({
      nickname: 'Grace',
      location: 'Bangkok',
    });

    expect(getApplicantPersonalInfo('{bad json')).toBeUndefined();
    expect(getApplicantPersonalInfo(null)).toBeUndefined();
  });

  it('composes full names from non-empty string parts only', () => {
    expect(composeApplicantInfoFullName('Dr.', ' Ada ', ' Lovelace ')).toBe('Dr. Ada Lovelace');
    expect(composeApplicantInfoFullName('', 'Ada', '')).toBe('Ada');
    expect(composeApplicantInfoFullName(null, ' ', 123)).toBe('');
  });

  it('normalizes display field values', () => {
    expect(getApplicantInfoFieldValue('  Bangkok  ')).toBe('Bangkok');
    expect(getApplicantInfoFieldValue('')).toBe('');
    expect(getApplicantInfoFieldValue(null)).toBe('');
    expect(getApplicantInfoFieldValue({ value: 'ignored' })).toBe('');
  });

  it('normalizes form error messages', () => {
    expect(getApplicantInfoFormErrorMessage({ message: 'Required' })).toBe('Required');
    expect(getApplicantInfoFormErrorMessage({ message: 123 })).toBeNull();
    expect(getApplicantInfoFormErrorMessage(null)).toBeNull();
  });
});
