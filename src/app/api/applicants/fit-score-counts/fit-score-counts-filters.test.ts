import { describe, expect, it, vi } from 'vitest';

import {
  buildFitScoreCountsWhereClause,
  type QueryClient,
} from './fit-score-counts-filters';

function createClient(rows: Array<Record<string, unknown>> = []): QueryClient {
  return {
    query: vi.fn(async () => ({ rows })),
  };
}

describe('fit score count filter builder', () => {
  it('returns an empty where clause when no filters are provided', async () => {
    await expect(
      buildFitScoreCountsWhereClause(createClient(), new URLSearchParams())
    ).resolves.toEqual({
      whereClause: '',
      queryParams: [],
    });
  });

  it('builds selection and advanced filters with stable parameter order', async () => {
    const statusId = '11111111-1111-4111-8111-111111111111';
    const resolvedStatusId = '22222222-2222-4222-8222-222222222222';
    const client = createClient([{ id: resolvedStatusId }]);
    const searchParams = new URLSearchParams({
      positionId: 'position-1,position-2',
      status: `${statusId}, Interviewing`,
      recruiterId: 'unassigned,recruiter-1',
      sourceId: 'unassigned,source-1,source-2',
      minAppliedJobFitScore: '75',
      maxAppliedJobFitScore: '95',
      includeNoScoreInApplied: 'true',
      skills: 'React, Node',
      location: 'Bangkok',
      locationOperator: 'startsWith',
    });

    const result = await buildFitScoreCountsWhereClause(client, searchParams);

    expect(client.query).toHaveBeenCalledWith(
      'SELECT id FROM "RecruitmentStage" WHERE name = ANY($1::text[])',
      [['Interviewing']]
    );
    expect(result.whereClause).toContain(`c."positionId" IN ($1, $2)`);
    expect(result.whereClause).toContain(`c."statusId" = ANY($3::uuid[])`);
    expect(result.whereClause).toContain(`(c."recruiterId" IS NULL OR c."recruiterId" = ANY($4::uuid[]))`);
    expect(result.whereClause).toContain(`(c."sourceId" = ANY($5::uuid[]) OR c."sourceId" IS NULL)`);
    expect(result.whereClause).toContain(`((c."fitScore" >= $6 AND c."fitScore" <= $7) OR (c."fitScore" IS NULL OR c."fitScore" = 0))`);
    expect(result.whereClause).toContain(`LOWER(c."parsedData"->>'skills') LIKE $8`);
    expect(result.whereClause).toContain(`c.location ILIKE $10`);
    expect(result.queryParams).toEqual([
      'position-1',
      'position-2',
      [statusId, resolvedStatusId],
      ['recruiter-1'],
      ['source-1', 'source-2'],
      0.75,
      0.95,
      '%react%',
      '%node%',
      'Bangkok%',
    ]);
  });

  it('handles no-score and missing-experience filters without query parameters', async () => {
    const result = await buildFitScoreCountsWhereClause(
      createClient(),
      new URLSearchParams({
        minAppliedJobFitScore: '-1',
        maxAppliedJobFitScore: '-1',
        minExperienceYears: '-1',
      })
    );

    expect(result.whereClause).toContain(`(c."fitScore" IS NULL OR c."fitScore" = 0)`);
    expect(result.whereClause).toContain(`c."parsedData"->>'experience' IS NULL`);
    expect(result.queryParams).toEqual([]);
  });
});
