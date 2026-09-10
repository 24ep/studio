import { getPool, type DbClient } from '@/lib/db';
import type { QueryResultRow } from 'pg';
import type { PositionJobMatchesQueryInput } from './position-job-matches-schema';
import { buildPositionJobMatchesQuery } from './position-job-matches-query';
import type { PositionJobMatchApplicantRow } from './position-job-matches-response';

export type { DbClient };

type PositionIdentityRow = QueryResultRow & {
  id: string;
  title: string;
};

type PositionJobMatchApplicantQueryRow = QueryResultRow & PositionJobMatchApplicantRow;

type CountRow = QueryResultRow & {
  total: string;
};

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export async function connectPositionJobMatchesClient() {
  try {
    return {
      ok: true as const,
      client: await getPool().connect(),
    };
  } catch (connectionError: unknown) {
    console.error('[Position Job Matches API] Failed to connect to database:', connectionError);
    return {
      ok: false as const,
      responseBody: {
        message: 'Database connection error',
        error: getErrorMessage(connectionError),
      },
    };
  }
}

export async function fetchPositionJobMatches(client: DbClient, input: PositionJobMatchesQueryInput) {
  const positionCheck = await client.query<PositionIdentityRow>('SELECT id, title FROM "Position" WHERE id = $1', [input.positionId]);
  if (positionCheck.rows.length === 0) {
    return { ok: false as const, reason: 'not-found' as const };
  }

  const query = buildPositionJobMatchesQuery(input);
  const [applicantsResult, countResult] = await Promise.all([
    client.query<PositionJobMatchApplicantQueryRow>(query.applicantsQuery, query.dataParams),
    client.query<CountRow>(query.countQuery, query.countParams),
  ]);

  return {
    ok: true as const,
    rows: applicantsResult.rows,
    total: Number.parseInt(countResult.rows[0].total, 10),
  };
}
