import { NextRequest, NextResponse } from 'next/server';
import { getSafeDbClient } from '@/lib/db';
import { requireApiPermission } from '@/lib/api-route-guards';

export const dynamic = 'force-dynamic';

type QueueStatus = 'queued' | 'inprocess' | 'success' | 'failed';

type QueueStatsRow = {
  status: QueueStatus;
  count: string;
};

type StuckJobRow = {
  id: string;
  file_name: string;
  status: QueueStatus;
  process_date: Date | string | null;
  minutes_stuck: string | number;
  error: string | null;
};

/**
 * @openapi
 * /api/upload-queue/health:
 *   get:
 *     summary: Check upload queue health status
 *     description: Returns the current status of the upload queue including counts of different job statuses
 *     responses:
 *       200:
 *         description: Queue health status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [healthy, warning, critical]
 *                 queue_stats:
 *                   type: object
 *                   properties:
 *                     queued:
 *                       type: number
 *                     inprocess:
 *                       type: number
 *                     success:
 *                       type: number
 *                     failed:
 *                       type: number
 *                 stuck_jobs:
 *                   type: array
 *                   items:
 *                     type: object
 *                 recommendations:
 *                   type: array
 *                   items:
 *                     type: string
 */
export async function GET(request: NextRequest) {
  const { response } = await requireApiPermission('UPLOAD_QUEUE_VIEW');
  if (response) return response;

  const client = await getSafeDbClient();
  
  try {
    // Get overall queue statistics
    const statsQuery = await client.query<QueueStatsRow>(`
      SELECT 
        status,
        COUNT(*) as count
      FROM upload_queue 
      GROUP BY status 
      ORDER BY status
    `);
    
    const stats = {
      queued: 0,
      inprocess: 0,
      success: 0,
      failed: 0
    };
    
    statsQuery.rows.forEach((row) => {
      stats[row.status as keyof typeof stats] = parseInt(row.count, 10);
    });
    
    // Check for stuck jobs (inprocess for more than 30 minutes)
    const stuckJobsQuery = await client.query<StuckJobRow>(`
      SELECT 
        id,
        file_name,
        status,
        process_date,
        EXTRACT(EPOCH FROM (NOW() - process_date))/60 as minutes_stuck,
        error
      FROM upload_queue 
      WHERE status = 'inprocess' 
      AND process_date < NOW() - INTERVAL '30 minutes'
      ORDER BY process_date ASC
    `);
    
    const stuckJobs = stuckJobsQuery.rows.map((row) => ({
      id: row.id,
      file_name: row.file_name,
      minutes_stuck: Math.round(Number(row.minutes_stuck)),
      error: row.error
    }));
    
    // Determine overall health status
    let status = 'healthy';
    const recommendations: string[] = [];
    
    if (stuckJobs.length > 0) {
      status = 'critical';
      recommendations.push(`Reset ${stuckJobs.length} stuck jobs that have been processing for over 30 minutes`);
    }
    
    if (stats.failed > 0 && stats.queued === 0) {
      status = status === 'critical' ? 'critical' : 'warning';
      recommendations.push(`${stats.failed} failed jobs exist. No queued jobs available. Failed jobs can be manually retried by setting source to 'reprocess'`);
    }
    
    if (stats.inprocess > 5) {
      status = status === 'critical' ? 'critical' : 'warning';
      recommendations.push(`High number of jobs in process (${stats.inprocess}). Consider checking for stuck jobs.`);
    }
    
    if (stats.queued > 100) {
      status = status === 'critical' ? 'critical' : 'warning';
      recommendations.push(`Large queue backlog (${stats.queued} jobs). Consider scaling up processing capacity.`);
    }
    
    return NextResponse.json({
      status,
      queue_stats: stats,
      stuck_jobs: stuckJobs,
      recommendations,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error checking queue health:', error);
    return NextResponse.json(
      { 
        status: 'critical', 
        error: 'Failed to check queue health',
        message: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
