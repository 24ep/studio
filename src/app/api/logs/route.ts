// src/app/api/logs/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import type { LogEntry, LogLevel } from '@/lib/types';
import { z } from 'zod';

const logLevelValues: [LogLevel, ...LogLevel[]] = ['INFO', 'WARN', 'ERROR', 'DEBUG', 'AUDIT'];

const createLogEntrySchema = z.object({
  level: z.enum(logLevelValues),
  message: z.string().min(1, { message: "Log message cannot be empty" }),
  source: z.string().optional(),
  timestamp: z.string().datetime({ message: "Invalid datetime string. Must be UTC ISO8601" }).optional(),
  actingUserId: z.string().uuid().nullable().optional(),
  details: z.record(z.any()).nullable().optional(),
});

export async function POST(request: NextRequest) {
  let body;
  try {
    body = await request.json();
  } catch (error) {
    console.error("Failed to parse log request body:", error);
    return NextResponse.json({ message: "Error parsing request body", error: (error as Error).message }, { status: 400 });
  }

  const validationResult = createLogEntrySchema.safeParse(body);
  if (!validationResult.success) {
    return NextResponse.json(
      { message: "Invalid log entry data", errors: validationResult.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { level, message, source, timestamp, actingUserId, details } = validationResult.data;

  try {
    const insertQuery = `
      INSERT INTO "LogEntry" (timestamp, level, message, source, "actingUserId", details, "createdAt")
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      RETURNING *;
    `;
    const values = [
      timestamp ? new Date(timestamp) : new Date(), 
      level,
      message,
      source,
      actingUserId || null,
      details || null,
    ];
    const result = await pool.query(insertQuery, values);
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error("Failed to create log entry:", error);
    return NextResponse.json({ message: "Error creating log entry", error: (error as Error).message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get('limit');
    const offsetParam = searchParams.get('offset');
    const levelFilter = searchParams.get('level');
    const searchQuery = searchParams.get('search');
    const startDateFilter = searchParams.get('startDate');
    const endDateFilter = searchParams.get('endDate');
    const actingUserIdFilter = searchParams.get('actingUserId');


    let limit = 50; 
    if (limitParam) {
      const parsedLimit = parseInt(limitParam, 10);
      if (!isNaN(parsedLimit) && parsedLimit > 0 && parsedLimit <= 200) { 
        limit = parsedLimit;
      }
    }

    let offset = 0; 
    if (offsetParam) {
      const parsedOffset = parseInt(offsetParam, 10);
      if (!isNaN(parsedOffset) && parsedOffset >= 0) {
        offset = parsedOffset;
      }
    }
    
    const queryParams: any[] = [];
    const conditions = [];
    let paramIndex = 1;
    
    if (levelFilter && logLevelValues.includes(levelFilter as LogLevel)) {
        conditions.push(`level = $${paramIndex++}`);
        queryParams.push(levelFilter);
    }

    if (searchQuery) {
      // Search in message or source
      conditions.push(`(message ILIKE $${paramIndex++} OR source ILIKE $${paramIndex++})`);
      queryParams.push(`%${searchQuery}%`, `%${searchQuery}%`);
    }

    if (startDateFilter) {
        conditions.push(`timestamp >= $${paramIndex++}`);
        queryParams.push(new Date(startDateFilter).toISOString());
    }
    if (endDateFilter) {
        const endDate = new Date(endDateFilter);
        endDate.setHours(23, 59, 59, 999); // Include the whole end day
        conditions.push(`timestamp <= $${paramIndex++}`);
        queryParams.push(endDate.toISOString());
    }
    if (actingUserIdFilter) {
        conditions.push(`"actingUserId" = $${paramIndex++}`);
        queryParams.push(actingUserIdFilter);
    }
    
    let query = `
      SELECT l.id, l.timestamp, l.level, l.message, l.source, l."actingUserId", u.name as "actingUserName", l.details, l."createdAt" 
      FROM "LogEntry" l
      LEFT JOIN "User" u ON l."actingUserId" = u.id
    `;
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ` ORDER BY l.timestamp DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++};`;
    queryParams.push(limit, offset);
    
    const result = await pool.query(query, queryParams);
    
    let countQuery = `SELECT COUNT(*) FROM "LogEntry"`;
    if (conditions.length > 0) {
      // Adjust paramIndex for count query as limit/offset are not included
      const countConditionsParams = queryParams.slice(0, paramIndex - 3); // Exclude limit, offset, and the $ for limit
      const countConditionsSql = conditions.map((cond, i) => cond.replace(/\$(\d+)/g, (match, n) => `$${parseInt(n, 10)}`)).join(' AND ');
      countQuery += ' WHERE ' + countConditionsSql;
       const countResult = await pool.query(countQuery, countConditionsParams);
       return NextResponse.json({ logs: result.rows, total: parseInt(countResult.rows[0].count, 10) }, { status: 200 });
    } else {
        const countResult = await pool.query(countQuery);
        return NextResponse.json({ logs: result.rows, total: parseInt(countResult.rows[0].count, 10) }, { status: 200 });
    }


  } catch (error) {
    console.error("Failed to fetch log entries:", error);
    return NextResponse.json({ message: "Error fetching log entries", error: (error as Error).message }, { status: 500 });
  }
}
