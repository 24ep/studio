import { describe, expect, it } from 'vitest';

import {
  ApplicantInfoSchema,
  structuredEducationSchema,
  structuredExperienceSchema,
} from './schemas';

describe('v1 applicant schemas', () => {
  it('normalizes broad applicant info inputs to defaults', () => {
    expect(ApplicantInfoSchema.parse('raw text')).toMatchObject({
      personal_info: {},
      contact_info: {},
      cv_language: '',
      skills: [],
      job_suitable: [],
      status: '',
      job_matches: [],
    });
  });

  it('coerces structured education numeric and boolean fields', () => {
    expect(structuredEducationSchema.parse({
      startMonth: '06',
      startYear: 'bad',
      endMonth: true,
      endYear: null,
      isCurrent: 'true',
      GPA: '3.75',
    })).toMatchObject({
      startMonth: 6,
      startYear: undefined,
      endMonth: undefined,
      endYear: null,
      isCurrent: true,
      GPA: 3.75,
    });
  });

  it('coerces structured experience dates consistently', () => {
    expect(structuredExperienceSchema.parse({
      startMonth: '01',
      startYear: '2020',
      endMonth: false,
      endYear: '2022',
      isCurrent: 0,
    })).toMatchObject({
      startMonth: 1,
      startYear: 2020,
      endMonth: undefined,
      endYear: 2022,
      isCurrent: false,
    });
  });
});
