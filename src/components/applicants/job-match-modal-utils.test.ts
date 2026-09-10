import { describe, expect, it } from 'vitest';

import {
  buildApplicantsAdvancedQuery,
  buildApplicantsSearchUrl,
  buildJobMatchStatisticsUrl,
  DEFAULT_JOB_MATCH_STATS,
  displayFitScoreWithGrade,
  formatJobMatchRequirements,
  sanitizeJobMatchStats,
} from './job-match-modal-utils';

describe('job match modal utilities', () => {
  it('formats requirements and fit score labels', () => {
    expect(formatJobMatchRequirements('React, TypeScript')).toBe('React, TypeScript');
    expect(formatJobMatchRequirements(['React', '', 'TypeScript', 123])).toBe('React, TypeScript');
    expect(formatJobMatchRequirements(null)).toBe('');

    expect(displayFitScoreWithGrade(null)).toBe('0% (E)');
    expect(displayFitScoreWithGrade(Number.NaN)).toBe('0% (E)');
  });

  it('builds statistics and applicant search URLs', () => {
    expect(buildJobMatchStatisticsUrl('position 1')).toBe('/api/positions/position%201/statistics');
    expect(buildApplicantsAdvancedQuery('position-1', 'applied')).toBe('positionId:position-1');
    expect(buildApplicantsAdvancedQuery('position-1', 'matching')).toBe('positionId:position-1 minAppliedJobFitScore:70');
    expect(buildApplicantsAdvancedQuery('position-1', 'matchingNotApplied')).toBe('positionId:position-1 minAppliedJobFitScore:80');
    expect(buildApplicantsSearchUrl('position-1', 'matching')).toBe('/applicants?query=positionId%3Aposition-1%20minAppliedJobFitScore%3A70');
  });

  it('sanitizes statistics payloads', () => {
    expect(sanitizeJobMatchStats({
      totalApplied: 4,
      totalMatching: 2,
      matchingNotApplied: 1,
    })).toEqual({
      totalApplied: 4,
      totalMatching: 2,
      matchingNotApplied: 1,
    });

    expect(sanitizeJobMatchStats({
      totalApplied: '4',
      totalMatching: Number.POSITIVE_INFINITY,
    })).toEqual(DEFAULT_JOB_MATCH_STATS);
    expect(sanitizeJobMatchStats(null)).toEqual(DEFAULT_JOB_MATCH_STATS);
  });
});
