import { describe, expect, it } from 'vitest';

import { buildApplicantsExportFilterQuery } from './applicants-export-filters';

describe('applicants export filters', () => {
  it('builds text, uuid-list, score, and date filters from query params', () => {
    const result = buildApplicantsExportFilterQuery(new URLSearchParams({
      name: 'Ada',
      positionId: 'position-1, position-2',
      minAppliedJobFitScore: '75',
      applicationDateStart: '2026-01-01',
    }));

    expect(result.whereClause).toContain('c.name ILIKE $1');
    expect(result.whereClause).toContain('c."positionId" = ANY($2::uuid[])');
    expect(result.whereClause).toContain('c."fitScore" >= $3');
    expect(result.whereClause).toContain('c."applicationDate" >= $4');
    expect(result.queryParams).toEqual([
      '%Ada%',
      ['position-1', 'position-2'],
      0.75,
      new Date('2026-01-01'),
    ]);
  });

  it('maps advanced query aliases to export filters', () => {
    const result = buildApplicantsExportFilterQuery(new URLSearchParams({
      query: 'position:position-1 recruiter:recruiter-1 maxFitScore:0.8 applicationDateEnd:2026-02-01',
    }));

    expect(result.whereClause).toContain('c."positionId" = $1');
    expect(result.whereClause).toContain('c."recruiterId" = $2');
    expect(result.whereClause).toContain('c."fitScore" <= $3');
    expect(result.whereClause).toContain('c."applicationDate" <= $4');
    expect(result.queryParams).toEqual([
      'position-1',
      'recruiter-1',
      0.8,
      new Date('2026-02-01'),
    ]);
  });

  it('returns an empty filter when no supported filters are present', () => {
    expect(buildApplicantsExportFilterQuery(new URLSearchParams({
      query: 'unknown:value',
    }))).toEqual({
      whereClause: '',
      queryParams: [],
    });
  });
});
