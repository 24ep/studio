import { NextResponse, type NextRequest } from 'next/server';
import { auth } from '@/auth';
import { getPool } from '@/lib/db';
import type { QueryResultRow } from 'pg';

/**
 * @openapi
 * /api/realtime/collaboration-events:
 *   get:
 *     summary: Get collaboration events
 *     responses:
 *       200:
 *         description: Collaboration events data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */

export const dynamic = "force-dynamic";

type CollaborationEventRow = QueryResultRow & {
  id: string;
  level: string;
  message: string;
  source: string | null;
  timestamp: Date | string | null;
  details: unknown;
  actingUserId: string | null;
  actingUserName: string | null;
  actingUserEmail: string | null;
};

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '50', 10)));

  const client = await getPool().connect();
  try {
    const result = await client.query<CollaborationEventRow>(
      `
        SELECT
          l.id,
          l.level,
          l.message,
          l.source,
          l.timestamp,
          l.details,
          l."actingUserId",
          u.name AS "actingUserName",
          u.email AS "actingUserEmail"
        FROM "LogEntry" l
        LEFT JOIN "User" u ON l."actingUserId" = u.id
        WHERE l.level IN ('AUDIT', 'INFO')
        ORDER BY l.timestamp DESC
        LIMIT $1
      `,
      [limit]
    );

    const events = result.rows.map((row) => ({
      id: row.id,
      type: row.source || row.level,
      message: row.message,
      source: row.source,
      level: row.level,
      timestamp: row.timestamp ? new Date(row.timestamp).getTime() : Date.now(),
      userId: row.actingUserId,
      userName: row.actingUserName || row.actingUserEmail || 'System',
      details: row.details || {},
    }));

    return NextResponse.json(events);
  } catch (error) {
    console.error('Error getting collaboration events:', error);
    return NextResponse.json(
      { error: 'Failed to get collaboration events', details: getErrorMessage(error) },
      { status: 500 }
    );
  } finally {
    client.release();
  }
} 
