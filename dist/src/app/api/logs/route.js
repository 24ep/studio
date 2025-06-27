// src/app/api/logs/route.ts
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getPool } from '../../../lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
export const dynamic = "force-dynamic";
const logLevelValues = ['INFO', 'WARN', 'ERROR', 'DEBUG', 'AUDIT'];
const createLogEntrySchema = z.object({
    level: z.enum(logLevelValues),
    message: z.string().min(1, { message: "Log message cannot be empty" }),
    source: z.string().optional(),
    timestamp: z.string().datetime({ message: "Invalid datetime string. Must be UTC ISO8601" }).optional(),
    actingUserId: z.string().uuid().nullable().optional(),
    details: z.record(z.any()).nullable().optional(),
});
export async function POST(request) {
    let body;
    try {
        body = await request.json();
    }
    catch (error) {
        console.error("Failed to parse log request body:", error);
        return NextResponse.json({ message: "Error parsing request body", error: error.message }, { status: 400 });
    }
    const validationResult = createLogEntrySchema.safeParse(body);
    if (!validationResult.success) {
        return NextResponse.json({ message: "Invalid log entry data", errors: validationResult.error.flatten().fieldErrors }, { status: 400 });
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
        const result = await getPool().query(insertQuery, values);
        return NextResponse.json(result.rows[0], { status: 201 });
    }
    catch (error) {
        console.error("Failed to create log entry:", error);
        return NextResponse.json({ message: "Error creating log entry", error: error.message }, { status: 500 });
    }
}
/**
 * @openapi
 * /api/logs:
 *   get:
 *     summary: Get system logs
 *     description: Returns a paginated list of system and application logs. Requires authentication.
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *         example: 20
 *       - in: query
 *         name: level
 *         schema:
 *           type: string
 *           enum: [INFO, WARN, ERROR, DEBUG, AUDIT]
 *         description: Filter by log level
 *         example: ERROR
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in message or source
 *         example: "database"
 *       - in: query
 *         name: actingUserId
 *         schema:
 *           type: string
 *         description: Filter by acting user ID
 *         example: "user-uuid"
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter logs after this date
 *         example: "2024-01-01T00:00:00.000Z"
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter logs before this date
 *         example: "2024-01-31T23:59:59.999Z"
 *     responses:
 *       200:
 *         description: Paginated logs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *             examples:
 *               success:
 *                 summary: Example response
 *                 value:
 *                   data:
 *                     - id: "uuid"
 *                       timestamp: "2024-01-01T12:00:00.000Z"
 *                       level: "ERROR"
 *                       message: "Database connection failed"
 *                       source: "API:Positions:GetAll"
 *                       actingUserId: "user-uuid"
 *                       actingUserName: "Alice"
 *                   pagination:
 *                     page: 1
 *                     limit: 20
 *                     total: 1
 *                     totalPages: 1
 *       401:
 *         description: Unauthorized
 */
export async function GET(request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const offset = (page - 1) * limit;
    const level = searchParams.get('level');
    let whereClauses = [];
    let queryParams = [];
    let paramIndex = 1;
    if (level) {
        whereClauses.push(`level = $${paramIndex++}`);
        queryParams.push(level);
    }
    const whereString = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
    const client = await getPool().connect();
    try {
        const logsQuery = `
            SELECT * FROM "LogEntry"
            ${whereString}
            ORDER BY timestamp DESC
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1};
        `;
        const logsResult = await client.query(logsQuery, [...queryParams, limit, offset]);
        const totalQuery = `SELECT COUNT(*) FROM "LogEntry" ${whereString};`;
        const totalResult = await client.query(totalQuery, queryParams.slice(0, paramIndex - 1));
        const total = parseInt(totalResult.rows[0].count, 10);
        return NextResponse.json({
            data: logsResult.rows,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    }
    catch (error) {
        console.error('Failed to fetch logs:', error);
        return NextResponse.json({ message: 'Error fetching logs', error: error.message }, { status: 500 });
    }
    finally {
        client.release();
    }
}
