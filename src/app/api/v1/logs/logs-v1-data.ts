import { getPool } from '@/lib/db';
import { buildV1LogsWhere, type V1LogsQuery } from './logs-v1-query';
import type { QueryResultRow } from 'pg';

type V1AuditLogRow = QueryResultRow & {
  id: string;
  level: string;
  message: string;
  details: unknown;
  userId: string | null;
  userName: string | null;
  actionType: string | null;
  createdAt: Date | string;
};

type CountRow = QueryResultRow & {
  total: string | number;
};

function serializeAuditLog(row: V1AuditLogRow) {
  return {
    id: row.id,
    level: row.level,
    message: row.message,
    details: row.details,
    userId: row.userId,
    userName: row.userName,
    actionType: row.actionType,
    createdAt: row.createdAt,
  };
}

export async function fetchV1Logs(query: V1LogsQuery) {
  const client = await getPool().connect();

  try {
    const where = buildV1LogsWhere(query);
    const countQuery = `SELECT COUNT(*) as total FROM "AuditLog" ${where.whereClause}`;
    const countResult = await client.query<CountRow>(countQuery, where.queryParams);
    const total = parseInt(String(countResult.rows[0]?.total || '0'), 10);

    const logsQuery = `
      SELECT 
        id,
        level,
        message,
        details,
        user_id as "userId",
        user_name as "userName",
        action_type as "actionType",
        created_at as "createdAt"
      FROM "AuditLog"
      ${where.whereClause}
      ORDER BY created_at DESC
      LIMIT $${where.nextParamIndex} OFFSET $${where.nextParamIndex + 1}
    `;

    const logsResult = await client.query<V1AuditLogRow>(logsQuery, [
      ...where.queryParams,
      query.limit,
      query.offset,
    ]);

    return {
      data: logsResult.rows.map(serializeAuditLog),
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  } finally {
    client.release();
  }
}
