import { NextRequest, NextResponse } from 'next/server';
import { hasPermission } from '@/lib/permissions';
import { getPool } from '@/lib/db';
import { logAudit } from '@/lib/auditLog';
import { formatResponseTime } from '@/lib/api-response-time';

import { auth } from '@/auth';
import type { QueryResultRow } from 'pg';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type PendingCountRow = QueryResultRow & {
  queued: string | number;
  inprocess: string | number;
  dataqueued: string | number;
  dataprocessing: string | number;
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

    // Check if user has permission to view process queue data
    // Users should be able to view queue data if they can manage uploads or view performance monitoring data
    if (!hasPermission(session.user, 'UPLOAD_QUEUE_VIEW') && 
        !hasPermission(session.user, 'APP_PERFORMANCE_VIEW')) {
      return NextResponse.json({ message: 'Forbidden: Insufficient permissions to view process queue data' }, { status: 403 });
    }

    const actingUserId = session.user.id;
    const actingUserName = (session.user.name || session.user.email || actingUserId || 'System') as string;

    const client = await getPool().connect();
    
    try {
      // Query to get pending count (queued + inprocess)
      const countQuery = `
        SELECT
          (SELECT COUNT(*) FROM upload_queue WHERE status = 'queued') AS queued,
          (SELECT COUNT(*) FROM upload_queue WHERE status = 'inprocess') AS inprocess,
          (SELECT COUNT(*) FROM data_operation_jobs WHERE status = 'pending') AS dataqueued,
          (SELECT COUNT(*) FROM data_operation_jobs WHERE status = 'processing') AS dataprocessing
      `;

      const result = await client.query<PendingCountRow>(countQuery);
      const counts = result.rows[0];

      const pendingCount = Number(counts.queued || 0) + Number(counts.inprocess || 0)
        + Number(counts.dataqueued || 0) + Number(counts.dataprocessing || 0);

      const response = {
        count: pendingCount
      };

      // Log the count access for audit
      await logAudit(
        'INFO',
        `Process queue pending count accessed by ${actingUserName}`,
        'API:ProcessQueue:PendingCount',
        actingUserId,
        { pendingCount }
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
    console.error('Error fetching process queue pending count:', error);
    return NextResponse.json({ 
      message: 'Error fetching process queue pending count', 
      error: getErrorMessage(error)
    }, { status: 500 });
  }
}
