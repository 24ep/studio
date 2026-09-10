import { type NextRequest } from 'next/server';
import type { LogLevel } from '@/lib/types';

export type LogsListQuery = {
  page: number;
  limit: number;
  offset: number;
  level: LogLevel | null;
  search: string | null;
  actingUserId: string | null;
  startDate: string | null;
  endDate: string | null;
};

export type LogsWhereClause = {
  whereString: string;
  queryParams: unknown[];
  nextParamIndex: number;
};

export function parseLogsListQuery(request: NextRequest): LogsListQuery {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '10', 10);

  return {
    page,
    limit,
    offset: (page - 1) * limit,
    level: searchParams.get('level') as LogLevel | null,
    search: searchParams.get('search'),
    actingUserId: searchParams.get('actingUserId'),
    startDate: searchParams.get('startDate'),
    endDate: searchParams.get('endDate'),
  };
}

export function buildLogsWhereClause(query: LogsListQuery): LogsWhereClause {
  const whereClauses = [];
  const queryParams = [];
  let paramIndex = 1;

  if (query.level) {
    whereClauses.push(`level = $${paramIndex++}`);
    queryParams.push(query.level);
  }

  if (query.search && query.search.trim()) {
    whereClauses.push(`(message ILIKE $${paramIndex} OR source ILIKE $${paramIndex})`);
    queryParams.push(`%${query.search.trim()}%`);
    paramIndex++;
  }

  if (query.actingUserId && query.actingUserId !== 'ALL') {
    whereClauses.push(`"actingUserId" = $${paramIndex++}`);
    queryParams.push(query.actingUserId);
  }

  if (query.startDate) {
    whereClauses.push(`timestamp >= $${paramIndex++}`);
    queryParams.push(new Date(query.startDate));
  }

  if (query.endDate) {
    whereClauses.push(`timestamp <= $${paramIndex++}`);
    queryParams.push(new Date(query.endDate));
  }

  return {
    whereString: whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '',
    queryParams,
    nextParamIndex: paramIndex,
  };
}
