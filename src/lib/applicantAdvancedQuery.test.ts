import { describe, expect, it } from 'vitest';
import {
  parseAdvancedQuery,
  parseAdvancedQueryEntries,
  validateAdvancedQuery
} from './applicantAdvancedQuery';

describe('applicant advanced query utilities', () => {
  it('parses quoted values without splitting on spaces', () => {
    expect(parseAdvancedQueryEntries('name:"Jane Doe" status:Applied')).toEqual([
      { key: 'name', value: 'Jane Doe', raw: 'name:"Jane Doe"' },
      { key: 'status', value: 'Applied', raw: 'status:Applied' },
    ]);
  });

  it('normalizes score percentages for client filters', () => {
    expect(parseAdvancedQuery('minAppliedJobFitScore:80 maxMatchingJobFitScore:95')).toMatchObject({
      minAppliedJobFitScore: 0.8,
      maxMatchingJobFitScore: 0.95,
    });
  });

  it('rejects unknown fields', () => {
    expect(validateAdvancedQuery('unknown:value')).toMatchObject({
      isValid: false,
      error: 'Unknown field: "unknown"',
    });
  });
});
