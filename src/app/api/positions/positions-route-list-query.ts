import type { NextRequest } from 'next/server';
import type { Session } from 'next-auth';

import {
  buildPositionCountQuery,
  buildPositionListDataQuery,
  buildPositionStatsQuery,
  buildPositionWhereClause,
} from './positions-route-list-builders';
import {
  buildPositionFilterConditions,
  parsePositionFilters,
} from './positions-route-list-filters';
import type { PositionListQuery } from './positions-route-list-types';

export { parsePositionFilters } from './positions-route-list-filters';

export async function buildPositionsQuery(
  request: NextRequest,
  session: Session,
): Promise<PositionListQuery> {
  const { searchParams } = new URL(request.url);
  const filters = parsePositionFilters(searchParams);
  const queryState = await buildPositionFilterConditions(filters, session);
  const whereClause = buildPositionWhereClause(queryState);
  const filterParams = [...queryState.queryParams];
  const queryParams = [...filterParams, filters.limit, filters.offset];
  const paramIndex = queryState.paramIndex;

  return {
    dataQuery: buildPositionListDataQuery(filters, queryState, whereClause, paramIndex),
    countQuery: buildPositionCountQuery(queryState, whereClause),
    statsQuery: buildPositionStatsQuery(queryState, whereClause),
    filterParams,
    queryParams,
    includeHeadcount: filters.includeHeadcount,
    includeapplicantStats: filters.includeapplicantStats,
    includeStats: filters.includeStats,
  };
}
