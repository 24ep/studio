import { type NextRequest } from 'next/server';

export type V1LogsQuery = {
  page: number;
  limit: number;
  offset: number;
  level: string | null;
  startDate: string | null;
  endDate: string | null;
  userId: string | null;
};

export type V1LogsWhere = {
  whereClause: string;
  queryParams: unknown[];
  nextParamIndex: number;
};

export function parseV1LogsQuery(request: NextRequest): V1LogsQuery {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '20', 10);

  return {
    page,
    limit,
    offset: (page - 1) * limit,
    level: searchParams.get('level'),
    startDate: searchParams.get('startDate'),
    endDate: searchParams.get('endDate'),
    userId: searchParams.get('userId'),
  };
}

export function buildV1LogsWhere(query: V1LogsQuery): V1LogsWhere {
  const whereConditions = [];
  const queryParams = [];
  let paramIndex = 1;

  if (query.level) {
    whereConditions.push(`level = $${paramIndex++}`);
    queryParams.push(query.level);
  }

  if (query.startDate) {
    whereConditions.push(`created_at >= $${paramIndex++}`);
    queryParams.push(query.startDate);
  }

  if (query.endDate) {
    whereConditions.push(`created_at <= $${paramIndex++}`);
    queryParams.push(`${query.endDate} 23:59:59`);
  }

  if (query.userId) {
    whereConditions.push(`user_id = $${paramIndex++}`);
    queryParams.push(query.userId);
  }

  return {
    whereClause: whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '',
    queryParams,
    nextParamIndex: paramIndex,
  };
}
