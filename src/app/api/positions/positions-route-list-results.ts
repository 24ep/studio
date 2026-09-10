import type { NextRequest } from 'next/server';
import { handleCors } from '@/lib/cors';
import { getPool } from '@/lib/db';
import { getSystemSetting } from '@/lib/systemSettings';
import {
  getApplicantStatsByPositionId,
  toInt,
} from './positions-route-applicant-stats';
import type {
  PositionListItem,
  PositionListQuery,
  PositionListRow,
  PositionStatistics,
  PositionStatsRow,
} from './positions-route-list-types';

export function mapPositionRows(rows: PositionListRow[], includeHeadcount: boolean): PositionListItem[] {
  return rows.map(row => {
    const position: PositionListItem = {
      ...row,
      custom_attributes: row.customAttributes || {},
    };

    if (includeHeadcount) {
      position.headcountData = {
        total: toInt(row.totalHeadcount),
        vacant: toInt(row.vacantHeadcount),
        filled: toInt(row.filledHeadcount),
      };
    }

    return position;
  });
}

export async function maybeAttachApplicantStats(positions: PositionListItem[], includeapplicantStats: boolean) {
  if (!includeapplicantStats || positions.length === 0) {
    return positions;
  }

  const jobMatchFeatureEnabled = await getSystemSetting('jobMatchFeatureEnabled');
  const pool = getPool();
  const statsMap = await getApplicantStatsByPositionId(
    positions.map(position => position.id),
    jobMatchFeatureEnabled !== 'false',
    async (sql, values) => {
      const result = await pool.query(sql, values);
      return { rows: result.rows };
    },
  );

  return positions.map(position => ({
    ...position,
    applicantStats: statsMap.get(position.id) || {
      totalApplied: 0,
      appliedStatusCount: 0,
      totalMatching: 0,
    },
  }));
}

export async function maybeGetPositionStatistics(query: PositionListQuery): Promise<PositionStatistics | null> {
  if (!query.includeStats) {
    return null;
  }

  try {
    const statsResult = await getPool().query<PositionStatsRow>(query.statsQuery, query.filterParams);
    const stats = statsResult.rows[0];
    return {
      total: toInt(stats?.total),
      open: toInt(stats?.open),
      closed: toInt(stats?.closed),
    };
  } catch {
    return { total: 0, open: 0, closed: 0 };
  }
}

export function getPositionsResponseHeaders(request: NextRequest) {
  return {
    ...handleCors(request),
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    Pragma: 'no-cache',
    Expires: '0',
  };
}
