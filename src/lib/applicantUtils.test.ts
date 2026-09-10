import { describe, expect, it } from 'vitest';

import { formatApplicantName, formatApplicantNameWithLang } from './applicantUtils';

describe('applicant name utilities', () => {
  it('formats name-only applicant data without requiring an id', () => {
    expect(formatApplicantName({ name: 'Somchai Example' })).toBe('Somchai Example');
  });

  it('detects Thai language metadata for name-only applicant data', () => {
    expect(formatApplicantNameWithLang({ name: 'สมชาย ใจดี' })).toMatchObject({
      lang: 'th',
      hasThai: true,
    });
  });
});
