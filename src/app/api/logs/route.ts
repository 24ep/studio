
// src/app/api/logs/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import pool from '../../../lib/db';
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
    const searchQuery = searchParams.get('search'); // New search parameter

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
    
    if (levelFilter && logLevelValues.includes(levelFilter as LogLevel)) {
        conditions.push(`level = $${queryParams.push(levelFilter)}`);
    }

    if (searchQuery) {
      conditions.push(`(message ILIKE $${queryParams.push(`%${searchQuery}%`)} OR source ILIKE $${queryParams.push(`%${searchQuery}%`)})`);
    }
    
    let query = `SELECT id, timestamp, level, message, source, "actingUserId", details, "createdAt" FROM "LogEntry"`;
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ` ORDER BY timestamp DESC LIMIT $${queryParams.push(limit)} OFFSET $${queryParams.push(offset)};`;
    
    const result = await pool.query(query, queryParams);
    
    let countQuery = `SELECT COUNT(*) FROM "LogEntry"`;
    if (conditions.length > 0) {
      // Reuse conditions for count, but not limit/offset params
      const countConditions = conditions.map((cond, i) => cond.replace(`$${i + 1}`, `$${i + 1}`)); // Adjust param indices for count
      countQuery += ' WHERE ' + countConditions.join(' AND ');
    }
    
    const countResult = await pool.query(countQuery, queryParams.slice(0, queryParams.length - 2)); // Exclude limit & offset for count

    return NextResponse.json({ logs: result.rows, total: parseInt(countResult.rows[0].count, 10) }, { status: 200 });

  } catch (error) {
    console.error("Failed to fetch log entries:", error);
    return NextResponse.json({ message: "Error fetching log entries", error: (error as Error).message }, { status: 500 });
  }
}
