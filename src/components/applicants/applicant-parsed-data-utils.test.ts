import { describe, expect, it } from 'vitest';

import {
  getApplicantParsedArrayField,
  getApplicantParsedRecordField,
  isApplicantParsedRecord,
  parseApplicantParsedDataRecord,
} from './applicant-parsed-data-utils';

describe('applicant parsed data utilities', () => {
  it('recognizes parsed data records only', () => {
    expect(isApplicantParsedRecord({ personal_info: {} })).toBe(true);
    expect(isApplicantParsedRecord([])).toBe(false);
    expect(isApplicantParsedRecord(null)).toBe(false);
  });

  it('parses JSON strings and ignores malformed or non-record values', () => {
    expect(parseApplicantParsedDataRecord('{"personal_info":{"firstname":"Ada"}}')).toEqual({
      personal_info: { firstname: 'Ada' },
    });
    expect(parseApplicantParsedDataRecord('[1,2]')).toEqual({});
    expect(parseApplicantParsedDataRecord('{bad json')).toEqual({});
  });

  it('returns record and array fields defensively', () => {
    const parsedData = {
      personal_info: { firstname: 'Ada' },
      education: [{ school: 'A' }],
      skills: 'invalid',
    };

    expect(getApplicantParsedRecordField(parsedData, 'personal_info')).toEqual({ firstname: 'Ada' });
    expect(getApplicantParsedRecordField(parsedData, 'education')).toEqual({});
    expect(getApplicantParsedArrayField(parsedData, 'education')).toEqual([{ school: 'A' }]);
    expect(getApplicantParsedArrayField(parsedData, 'skills')).toEqual([]);
  });
});
