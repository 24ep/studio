import { NextRequest, NextResponse } from 'next/server';
import type { QueryResultRow } from 'pg';
import { getPool, type DbClient } from '@/lib/db';
import { requireApiPermission } from '@/lib/api-route-guards';

export const dynamic = 'force-dynamic';

type DatabaseHealthInfoRow = QueryResultRow & {
  current_time: Date;
  db_version: string;
};

type UploadQueueHealthStatsRow = QueryResultRow & {
  total_jobs: string;
  queued_jobs: string;
  processing_jobs: string;
  completed_jobs: string;
  failed_jobs: string;
};

/**
 * @openapi
 * /api/health/database:
 *   get:
 *     summary: Check database health status
 *     description: Tests database connectivity and basic operations
 *     responses:
 *       200:
 *         description: Database health status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: ['healthy', 'unhealthy']
 *                 message:
 *                   type: string
 *                 error:
 *                   type: string
 *       500:
 *         description: Internal server error
 */
export async function GET(request: NextRequest) {
  const { response } = await requireApiPermission('SYSTEM_SETTINGS_VIEW');
  if (response) return response;

  let client: DbClient | null = null;
  
  try {
    // console.log('[DB HEALTH] Starting database health check...');
    
    // Test connection
    const startTime = Date.now();
    client = await getPool().connect();
    const connectTime = Date.now() - startTime;
    
    // console.log(`[DB HEALTH] Database connection established in ${connectTime}ms`);
    
    // Test basic query
    const queryStartTime = Date.now();
    const result = await client.query<DatabaseHealthInfoRow>('SELECT NOW() as current_time, version() as db_version');
    const queryTime = Date.now() - queryStartTime;
    
    // console.log(`[DB HEALTH] Basic query completed in ${queryTime}ms`);
    
    // Test upload_queue table access
    const tableStartTime = Date.now();
    const tableResult = await client.query<UploadQueueHealthStatsRow>(`
      SELECT 
        COUNT(*) as total_jobs,
        COUNT(CASE WHEN status = 'queued' THEN 1 END) as queued_jobs,
        COUNT(CASE WHEN status = 'inprocess' THEN 1 END) as processing_jobs,
        COUNT(CASE WHEN status = 'success' THEN 1 END) as completed_jobs,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_jobs
      FROM upload_queue
    `);
    const tableTime = Date.now() - tableStartTime;
    
    // console.log(`[DB HEALTH] Table query completed in ${tableTime}ms`);
    
    const totalTime = Date.now() - startTime;
    
    return NextResponse.json({
      status: 'healthy',
      message: 'Database is working correctly',
      timings: {
        connection: connectTime,
        basicQuery: queryTime,
        tableQuery: tableTime,
        total: totalTime
      },
      databaseInfo: {
        currentTime: result.rows[0]?.current_time,
        // SECURITY: Removed database version to prevent information disclosure
        uploadQueueStats: tableResult.rows[0]
      },
      testResults: {
        connection: 'passed',
        basicQuery: 'passed',
        tableAccess: 'passed'
      }
    });
    
  } catch (error) {
    console.error('[DB HEALTH] Database health check failed:', error);
    
    // SECURITY: Never expose stack traces or detailed error messages in production
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    return NextResponse.json({
      status: 'unhealthy',
      message: 'Database health check failed',
      error: isDevelopment ? (error instanceof Error ? error.message : 'Unknown error') : 'Database connection failed',
      ...(isDevelopment && error instanceof Error && { stack: error.stack })
    }, { status: 500 });
    
  } finally {
    // Release the client
    if (client) {
      try {
        client.release();
        // console.log('[DB HEALTH] Database client released');
      } catch (releaseError) {
        console.error('[DB HEALTH] Error releasing database client:', releaseError);
      }
    }
  }
}
