import type {
  AppliedApplicantStatsRow,
  MatchingApplicantStatsRow,
} from './positions-route-list-types';

type ApplicantStatsQuery = (
  sql: string,
  values: [string[]],
) => Promise<{ rows: unknown[] }>;

export function toInt(value: string | number | null | undefined) {
  return parseInt(String(value || '0'), 10);
}

export async function getApplicantStatsByPositionId(
  positionIds: string[],
  isJobMatchEnabled: boolean,
  query: ApplicantStatsQuery,
) {
  const appliedStats = await getAppliedApplicantStats(positionIds, query);
  const matchingStats = isJobMatchEnabled
    ? await getMatchingApplicantStats(positionIds, query)
    : new Map<string, number>();

  return new Map(positionIds.map(positionId => {
    const totalApplied = appliedStats.get(positionId) || 0;

    return [
      positionId,
      {
        totalApplied,
        appliedStatusCount: totalApplied,
        totalMatching: matchingStats.get(positionId) || 0,
      },
    ];
  }));
}

async function getAppliedApplicantStats(
  positionIds: string[],
  query: ApplicantStatsQuery,
) {
  try {
    const result = await query(`
      SELECT
        c."positionId" as position_id,
        COUNT(*) as total_applied
      FROM "Applicant" c
      WHERE c."positionId" = ANY($1::uuid[])
      GROUP BY c."positionId"
    `, [positionIds]);
    const rows = result.rows as AppliedApplicantStatsRow[];

    return new Map(rows.map(row => [
      row.position_id,
      toInt(row.total_applied),
    ]));
  } catch (error) {
    console.error('Error fetching applied applicant counts for positions:', error);
    return new Map<string, number>();
  }
}

async function getMatchingApplicantStats(
  positionIds: string[],
  query: ApplicantStatsQuery,
) {
  try {
    const result = await query(`
      SELECT
        jm."jobId" as position_id,
        COUNT(DISTINCT jm."applicant_id") as total_matching
      FROM "JobMatch" jm
      WHERE jm."jobId" = ANY($1::uuid[])
      GROUP BY jm."jobId"
    `, [positionIds]);
    const rows = result.rows as MatchingApplicantStatsRow[];

    return new Map(rows.map(row => [
      row.position_id,
      toInt(row.total_matching),
    ]));
  } catch (error) {
    console.error('Error fetching matching applicant counts for positions:', error);
    return new Map<string, number>();
  }
}
