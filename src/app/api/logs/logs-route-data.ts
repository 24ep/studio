import { randomUUID } from 'crypto';

import { getPool } from '@/lib/db';
import type { CreateLogEntryInput } from './logs-route-schema';
import { buildLogsWhereClause, type LogsListQuery } from './logs-route-query';

async function sanitizeActingUserId(actingUserId?: string | null) {
  let sanitizedActingUserId = actingUserId || null;

  if (!sanitizedActingUserId) {
    return null;
  }

  try {
    const userCheck = await getPool().query('SELECT 1 FROM "User" WHERE id = $1 LIMIT 1', [sanitizedActingUserId]);
    if (userCheck.rowCount === 0) {
      sanitizedActingUserId = null;
    }
  } catch {
    sanitizedActingUserId = null;
  }

  return sanitizedActingUserId;
}

export async function createLogEntry(input: CreateLogEntryInput) {
  const sanitizedActingUserId = await sanitizeActingUserId(input.actingUserId);
  const insertQuery = `
    INSERT INTO "LogEntry" (id, timestamp, level, message, source, "actingUserId", details, "createdAt")
    VALUES ($1::uuid, $2, $3, $4, $5, $6, $7, NOW())
    RETURNING *;
  `;
  const values = [
    randomUUID(),
    input.timestamp ? new Date(input.timestamp) : new Date(),
    input.level,
    input.message,
    input.source,
    sanitizedActingUserId,
    input.details || null,
  ];
  const result = await getPool().query(insertQuery, values);
  return result.rows[0];
}

export async function fetchLogs(query: LogsListQuery) {
  const client = await getPool().connect();

  try {
    const where = buildLogsWhereClause(query);
    const logsQuery = `
      SELECT l.*, u.name as "actingUserName"
      FROM "LogEntry" l
      LEFT JOIN "User" u ON l."actingUserId" = u.id
      ${where.whereString}
      ORDER BY l.timestamp DESC
      LIMIT $${where.nextParamIndex} OFFSET $${where.nextParamIndex + 1};
    `;
    const logsResult = await client.query(logsQuery, [...where.queryParams, query.limit, query.offset]);

    const totalQuery = `
      SELECT COUNT(*) 
      FROM "LogEntry" l
      LEFT JOIN "User" u ON l."actingUserId" = u.id
      ${where.whereString};
    `;
    const totalResult = await client.query(totalQuery, where.queryParams);
    const total = parseInt(totalResult.rows[0].count, 10);

    return {
      data: logsResult.rows,
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
