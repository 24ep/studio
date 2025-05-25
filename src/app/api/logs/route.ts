
// src/app/api/logs/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import pool from '../../../lib/db';
import type { LogEntry, LogLevel } from '@/lib/types';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { z } from 'zod';

const logLevelValues: [LogLevel, ...LogLevel[]] = ['INFO', 'WARN', 'ERROR', 'DEBUG'];

const createLogEntrySchema = z.object({
  level: z.enum(logLevelValues),
  message: z.string().min(1, { message: "Log message cannot be empty" }),
  source: z.string().optional(),
  timestamp: z.string().datetime({ message: "Invalid datetime string. Must be UTC ISO8601" }).optional(),
});

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    // For logging, we might allow unauthenticated POSTs from internal systems or less critical client-side events.
    // However, for sensitive logs or to prevent abuse, authentication might be desired.
    // For now, let's assume logging can be done by authenticated users or trusted system components.
    // If logs can come from unauthenticated sources, consider rate limiting or other abuse prevention.
    // For this example, we'll proceed if there's a session, but you might adjust this.
    // console.warn("Attempt to POST log without session. This might be acceptable for some log sources.");
  }

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

  const { level, message, source, timestamp } = validationResult.data;

  try {
    const insertQuery = `
      INSERT INTO "LogEntry" (timestamp, level, message, source, "createdAt")
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING *;
    `;
    const values = [
      timestamp ? new Date(timestamp) : new Date(), // Use provided timestamp or current time
      level,
      message,
      source,
    ];
    const result = await pool.query(insertQuery, values);
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error("Failed to create log entry:", error);
    return NextResponse.json({ message: "Error creating log entry", error: (error as Error).message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get('limit');
    const offsetParam = searchParams.get('offset');
    const levelFilter = searchParams.get('level');

    let limit = 50; // Default limit
    if (limitParam) {
      const parsedLimit = parseInt(limitParam, 10);
      if (!isNaN(parsedLimit) && parsedLimit > 0 && parsedLimit <= 200) { // Max limit 200
        limit = parsedLimit;
      }
    }

    let offset = 0; // Default offset
    if (offsetParam) {
      const parsedOffset = parseInt(offsetParam, 10);
      if (!isNaN(parsedOffset) && parsedOffset >= 0) {
        offset = parsedOffset;
      }
    }
    
    const queryParams: any[] = [limit, offset];
    let query = `SELECT * FROM "LogEntry"`;
    const conditions = [];
    let paramIndex = 3; // Start after limit and offset

    if (levelFilter && logLevelValues.includes(levelFilter as LogLevel)) {
        conditions.push(`level = $${paramIndex++}`);
        queryParams.push(levelFilter);
    }

    if(conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ` ORDER BY timestamp DESC LIMIT $1 OFFSET $2;`;
    
    const result = await pool.query(query, queryParams);
    
    // Also get total count for pagination purposes
    let countQuery = `SELECT COUNT(*) FROM "LogEntry"`;
    if(conditions.length > 0) {
        // Rebuild count query params, excluding limit and offset
        const countQueryParams = queryParams.slice(2);
        countQuery += ' WHERE ' + conditions.join(' AND ');
        const countResult = await pool.query(countQuery, countQueryParams);
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
