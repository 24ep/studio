import { NextResponse, type NextRequest } from 'next/server';
import type { Session } from 'next-auth';
import { handleCors } from '@/lib/cors';
import { getPool } from '@/lib/db';
import { logAudit } from '@/lib/auditLog';
import { buildPositionsQuery } from './positions-route-list-query';
import { toInt } from './positions-route-applicant-stats';
import {
  getPositionsResponseHeaders,
  mapPositionRows,
  maybeAttachApplicantStats,
  maybeGetPositionStatistics,
} from './positions-route-list-results';
import type { CountRow, PositionListItem, PositionListRow, PositionStatistics } from './positions-route-list-types';

export async function handleGetPositions(request: NextRequest, session: Session) {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({
        message: 'Database configuration error',
        error: 'DATABASE_URL environment variable is not set',
      }, { status: 500, headers: handleCors(request) });
    }

    return await getPositionsFromDatabase(request, session);
  } catch (error) {
    console.error('Error fetching positions:', error);
    await logAudit(
      'ERROR',
      `Failed to fetch positions. Error: ${getErrorMessage(error)}`,
      'API:Positions:GetAll',
      session?.user?.id
    );
    return NextResponse.json(
      { message: 'Internal Server Error', error: 'An unexpected error occurred' },
      { status: 500, headers: handleCors(request) }
    );
  }
}

async function getPositionsFromDatabase(request: NextRequest, session: Session) {
  try {
    const query = await buildPositionsQuery(request, session);
    const pool = getPool();
    const result = await pool.query<PositionListRow>(query.dataQuery, query.queryParams);
    const countResult = await pool.query<CountRow>(query.countQuery, query.filterParams);
    const total = toInt(countResult.rows[0]?.count);

    let positions = mapPositionRows(result.rows, query.includeHeadcount);
    positions = await maybeAttachApplicantStats(positions, query.includeapplicantStats);
    const statistics = await maybeGetPositionStatistics(query);

    return NextResponse.json(
      buildPositionsResponse(positions, total, statistics),
      { status: 200, headers: getPositionsResponseHeaders(request) }
    );
  } catch (dbError) {
    console.error('Database error in positions API:', dbError);
    return NextResponse.json({
      message: 'Internal Server Error',
      error: 'An unexpected error occurred while fetching positions',
    }, { status: 500, headers: handleCors(request) });
  }
}

function buildPositionsResponse(positions: PositionListItem[], total: number, statistics: PositionStatistics | null) {
  const response: { data: PositionListItem[]; total: number; statistics?: PositionStatistics } = { data: positions, total };
  if (statistics) {
    response.statistics = statistics;
  }

  return response;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}
