import { NextRequest, NextResponse } from 'next/server';
import type { QueryResultRow } from 'pg';
import { getPool } from '@/lib/db';
import { requireApiPermission } from '@/lib/api-route-guards';
import {
  buildUploadQueueStats,
  getUploadQueueStatsErrorMessage,
  type UploadQueueStatusCount,
} from './upload-queue-stats-utils';

export const dynamic = 'force-dynamic';

type UploadQueueStatusCountRow = QueryResultRow & UploadQueueStatusCount;

type UploadQueueCountRow = QueryResultRow & {
  count: string;
};

type UploadQueueAverageTimeRow = QueryResultRow & {
  avg_seconds: string | null;
};

/**
 * @openapi
 * /api/upload-queue/stats:
 *   get:
 *     summary: Get upload queue statistics
 *     description: Returns statistics about the upload queue for monitoring purposes
 *     responses:
 *       200:
 *         description: Queue statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total_jobs:
 *                   type: number
 *                 queued_jobs:
 *                   type: number
 *                 inprocess_jobs:
 *                   type: number
 *                 success_jobs:
 *                   type: number
 *                 error_jobs:
 *                   type: number
 *                 stuck_jobs:
 *                   type: number
 *                 avg_processing_time:
 *                   type: number
 *                 jobs_per_hour:
 *                   type: number
 *       500:
 *         description: Error getting statistics
 */
export async function GET(request: NextRequest) {
  try {
    const { response } = await requireApiPermission('UPLOAD_QUEUE_VIEW');
    if (response) return response;

    const client = await getPool().connect();
    
    try {
      // Get basic counts by status
      const statusCounts = await client.query<UploadQueueStatusCountRow>(`
        SELECT 
          status,
          COUNT(*) as count
        FROM upload_queue 
        GROUP BY status
      `);
      
      // Get stuck jobs (inprocess for more than 30 minutes)
      const stuckJobs = await client.query<UploadQueueCountRow>(`
        SELECT COUNT(*) as count
        FROM upload_queue 
        WHERE status = 'inprocess' 
        AND process_date < NOW() - INTERVAL '30 minutes'
      `);
      
      // Get average processing time for completed jobs
      const avgProcessingTime = await client.query<UploadQueueAverageTimeRow>(`
        SELECT 
          AVG(EXTRACT(EPOCH FROM (completed_date - process_date))) as avg_seconds
        FROM upload_queue 
        WHERE status IN ('success', 'failed', 'error')
        AND process_date IS NOT NULL 
        AND completed_date IS NOT NULL
        AND completed_date > process_date
      `);
      
      // Get jobs processed in the last hour
      const jobsPerHour = await client.query<UploadQueueCountRow>(`
        SELECT COUNT(*) as count
        FROM upload_queue 
        WHERE completed_date > NOW() - INTERVAL '1 hour'
        AND status IN ('success', 'failed', 'error')
      `);
      
      // Get high retry jobs
      const highRetryJobs = await client.query<UploadQueueCountRow>(`
        SELECT COUNT(*) as count
        FROM upload_queue 
        WHERE status = 'error'
        AND webhook_payload->>'retry_count' IS NOT NULL
        AND (webhook_payload->>'retry_count')::int > 3
      `);
      
      // Get duplicate files in queue
      const duplicateFiles = await client.query<UploadQueueCountRow>(`
        SELECT COUNT(*) as count
        FROM (
          SELECT file_path, COUNT(*) as file_count
          FROM upload_queue 
          WHERE status = 'queued'
          AND file_path IS NOT NULL
          GROUP BY file_path
          HAVING COUNT(*) > 1
        ) as duplicates
      `);
      
      const stats = buildUploadQueueStats({
        avgProcessingTimeSeconds: avgProcessingTime.rows[0]?.avg_seconds,
        duplicateFiles: duplicateFiles.rows[0]?.count,
        highRetryJobs: highRetryJobs.rows[0]?.count,
        jobsPerHour: jobsPerHour.rows[0]?.count,
        statusCounts: statusCounts.rows,
        stuckJobs: stuckJobs.rows[0]?.count,
      });
      
      return NextResponse.json(stats, { status: 200 });
      
    } finally {
      client.release();
    }
    
  } catch (error: unknown) {
    console.error('[Upload Queue Stats] Error getting statistics:', error);
    return NextResponse.json({ 
      error: 'Failed to get upload queue statistics',
      details: getUploadQueueStatsErrorMessage(error) 
    }, { status: 500 });
  }
}
