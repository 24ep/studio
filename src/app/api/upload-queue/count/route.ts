import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { logAudit } from '@/lib/auditLog';
import { formatResponseTime } from '@/lib/api-response-time';

import { auth } from '@/auth';
import type { QueryResultRow } from 'pg';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type UploadQueueCountRow = QueryResultRow & {
  total: string | number;
  queued: string | number;
  inprocess: string | number;
  success: string | number;
  error: string | number;
};

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const actingUserId = session.user.id;
    const actingUserName = (session.user.name || session.user.email || actingUserId || 'System') as string;

    const client = await getPool().connect();
    
    try {
      // Single optimized query to get all counts at once
      const countQuery = `
        SELECT 
          COUNT(*) as total,
                  COUNT(*) FILTER (WHERE status = 'queued') as queued,
        COUNT(*) FILTER (WHERE status = 'inprocess') as inprocess,
        COUNT(*) FILTER (WHERE status = 'success') as success,
        COUNT(*) FILTER (WHERE status = 'failed') as error
        FROM upload_queue
      `;

      const result = await client.query<UploadQueueCountRow>(countQuery);
      const counts = result.rows[0];

      const response = {
        total: Number(counts.total) || 0,
        queued: Number(counts.queued) || 0,
        inprocess: Number(counts.inprocess) || 0,
        success: Number(counts.success) || 0,
        error: Number(counts.error) || 0,
        pending: Number(counts.queued || 0) + Number(counts.inprocess || 0)
      };

      // Log the count access for audit
      await logAudit(
        'INFO',
        `Upload queue count accessed by ${actingUserName}`,
        'API:UploadQueue:Count',
        actingUserId,
        { counts: response }
      );

      return NextResponse.json(response, {
        headers: {
          'Cache-Control': 'public, max-age=10, stale-while-revalidate=30',
          'X-Response-Time': formatResponseTime(startTime)
        }
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error fetching upload queue count:', error);
    return NextResponse.json({ 
      message: 'Error fetching upload queue count', 
      error: getErrorMessage(error)
    }, { status: 500 });
  }
}
