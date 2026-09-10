import {
  BASE_FROM,
  BASE_SELECT,
  HEADCOUNT_JOIN,
  HEADCOUNT_SELECT,
} from './positions-route-list-sql';
import type {
  PositionFilterConditions,
  PositionListFilters,
} from './positions-route-list-types';

export function buildPositionWhereClause(queryState: PositionFilterConditions) {
  return queryState.conditions.length > 0 ? ` WHERE ${queryState.conditions.join(' AND ')}` : '';
}

export function buildPositionListDataQuery(
  filters: PositionListFilters,
  queryState: PositionFilterConditions,
  whereClause: string,
  limitParamIndex: number,
) {
  return `
    ${BASE_SELECT}${filters.includeHeadcount ? HEADCOUNT_SELECT : ''}
    ${BASE_FROM}
    ${queryState.interviewerJoinClause}
    ${queryState.hiringManagerJoinClause}
    ${filters.includeHeadcount ? HEADCOUNT_JOIN : ''}
    ${whereClause}
    ORDER BY p."createdAt" DESC
    LIMIT $${limitParamIndex++} OFFSET $${limitParamIndex++}
  `;
}

export function buildPositionCountQuery(
  queryState: PositionFilterConditions,
  whereClause: string,
) {
  return `SELECT COUNT(*) as count FROM "Position" p ${queryState.interviewerJoinClause} ${queryState.hiringManagerJoinClause}${whereClause}`;
}

export function buildPositionStatsQuery(
  queryState: PositionFilterConditions,
  whereClause: string,
) {
  return `
    SELECT
      COUNT(*) as total,
      COUNT(CASE WHEN p."isOpen" = TRUE THEN 1 END) as open,
      COUNT(CASE WHEN p."isOpen" = FALSE THEN 1 END) as closed
    FROM "Position" p
    ${queryState.interviewerJoinClause}
    ${queryState.hiringManagerJoinClause}
    ${whereClause}
  `;
}
