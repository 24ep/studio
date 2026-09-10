import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

import { auth } from '@/auth';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use connection pool efficiently
    const pool = getPool();
    const client = await pool.connect();

    try {
      // Get basic dashboard statistics
      const statsRes = await client.query(`
        SELECT 
          (SELECT COUNT(*) FROM "Applicant") as total_Applicants,
          (SELECT COUNT(*) FROM "Position") as total_positions,
          (SELECT COUNT(*) FROM upload_queue WHERE status = 'queued') as queued_uploads,
          (SELECT COUNT(*) FROM upload_queue WHERE status = 'inprocess') as processing_uploads,
          (SELECT COUNT(*) FROM upload_queue WHERE status = 'success') as successful_uploads,
          (SELECT COUNT(*) FROM upload_queue WHERE status = 'failed') as failed_uploads
      `);
      
      // Get recent activity
      const recentActivityRes = await client.query(`
        SELECT 
          'Applicant' as type,
          c.id,
          c.name,
          c."createdAt" as timestamp,
          p.title as position_title
        FROM "Applicant" c
        LEFT JOIN "Position" p ON c."positionId" = p.id
        WHERE c."createdAt" >= NOW() - INTERVAL '24 hours'
        ORDER BY c."createdAt" DESC
        LIMIT 10
      `);
      
      // Get upload queue summary by status
      const queueSummaryRes = await client.query(`
        SELECT 
          status,
          COUNT(*) as count
        FROM upload_queue 
        GROUP BY status
        ORDER BY count DESC
      `);
      
      const stats = statsRes.rows[0];
      const recentActivity = recentActivityRes.rows;
      const queueSummary = queueSummaryRes.rows;
      
      return NextResponse.json({
        stats: {
          total_Applicants: Number(stats.total_Applicants) || 0,
          total_positions: Number(stats.total_positions) || 0,
          queued_uploads: Number(stats.queued_uploads) || 0,
          processing_uploads: Number(stats.processing_uploads) || 0,
          successful_uploads: Number(stats.successful_uploads) || 0,
          failed_uploads: Number(stats.failed_uploads) || 0
        },
        recent_activity: recentActivity,
        queue_summary: queueSummary,
        timestamp: new Date().toISOString()
      });
      
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('[DASHBOARD DATA] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
