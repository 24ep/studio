import { getPool } from '@/lib/db';
import { buildFitScoreCountsWhereClause } from './fit-score-counts-filters';
import { buildFitScoreGradeCounts, type FitScoreCountRow } from './fit-score-counts-score';

function buildFitScoreCountsQuery(whereClause: string) {
  return `
    SELECT 
      c."fitScore" as applied_score,
      COALESCE(
        (SELECT MAX(jm."fitScore") 
         FROM "JobMatch" jm 
         WHERE jm."applicant_id" = c.id), 
        COALESCE(
          (SELECT MAX((match->>'fitScore')::numeric) 
           FROM jsonb_array_elements(c."parsedData"->'job_matches') as match
           WHERE (match->>'fitScore') IS NOT NULL), 
          0
        )
      ) as best_match_score
    FROM "Applicant" c
    ${whereClause}
  `;
}

export async function fetchFitScoreCounts(searchParams: URLSearchParams) {
  const client = await getPool().connect();

  try {
    const { whereClause, queryParams } = await buildFitScoreCountsWhereClause(client, searchParams);
    const result = await client.query(buildFitScoreCountsQuery(whereClause), queryParams);
    return buildFitScoreGradeCounts(result.rows as FitScoreCountRow[]);
  } finally {
    client.release();
  }
}
