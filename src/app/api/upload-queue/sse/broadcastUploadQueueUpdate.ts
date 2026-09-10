import type { QueryResultRow } from 'pg';
import { getPool } from '@/lib/db';
import type { DbClient } from '@/lib/db';

type UploadQueueBroadcastJobRow = QueryResultRow & {
  id: string;
  file_path: string | null;
};

type UploadQueueSummaryRow = QueryResultRow & {
  total: string;
  queued: string;
  inprocess: string;
  success: string;
  error: string;
};

export async function broadcastUploadQueueUpdate() {
  let client: DbClient | undefined;
  try {
    // Fetch current queue data and counts from database
    client = await getPool().connect();
  } catch (connectionError: unknown) {
    console.error('[Broadcast] Failed to connect to database:', connectionError);
    // Fallback to empty data if database connection fails
    const fallbackSummary = { queued: 0, inprocess: 0, total: 0, success: 0, error: 0 };
    const { forceBroadcast } = await import('@/lib/aggressive-sse-optimizer');
    forceBroadcast('upload_queue_update', {
      type: 'queue',
      data: [],
      total: 0,
      summary: fallbackSummary,
      pagination: {
        page: 1,
        limit: 20,
        offset: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false
      },
      timestamp: new Date().toISOString()
    });
    return;
  }

  try {
    // Get the latest queue items (first page, 20 items)
    const dataRes = await client.query<UploadQueueBroadcastJobRow>(`
      SELECT uq.*, p.title as position_title 
      FROM upload_queue uq 
      LEFT JOIN "Position" p ON uq.position_id = p.id 
      ORDER BY uq.upload_date DESC LIMIT 20 OFFSET 0
    `);
    
    // Get summary counts by status
    const summaryRes = await client.query<UploadQueueSummaryRow>(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'queued') as queued,
        COUNT(*) FILTER (WHERE status = 'inprocess') as inprocess,
        COUNT(*) FILTER (WHERE status = 'success') as success,
        COUNT(*) FILTER (WHERE status = 'failed') as error
      FROM upload_queue
    `);
    
    const summary = summaryRes.rows[0];
    const safeSummary = {
      total: Number(summary.total) || 0,
      queued: Number(summary.queued) || 0,
      inprocess: Number(summary.inprocess) || 0,
      success: Number(summary.success) || 0,
      error: Number(summary.error) || 0,
    };
    
    // Add url field to each job (same as in the API endpoint)
    const jobsWithUrl = dataRes.rows.map((job) => ({
      ...job,
      url: job.file_path ? `/api/upload-queue/download/${job.id}` : null
    }));
    
    // Force immediate broadcast for upload queue updates (bypass throttling)
    // This ensures upload queue updates appear immediately after file upload
    const { forceBroadcast } = await import('@/lib/aggressive-sse-optimizer');
    forceBroadcast('upload_queue_update', {
      type: 'queue',
      data: jobsWithUrl, // Send actual queue items
      total: safeSummary.total,
      summary: safeSummary,
      pagination: {
        page: 1,
        limit: 20,
        offset: 0,
        totalPages: Math.ceil(safeSummary.total / 20),
        hasNextPage: 20 < safeSummary.total,
        hasPrevPage: false
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Broadcast] Failed to fetch queue data for broadcast:', error);
    // Fallback to empty data if database query fails
    const fallbackSummary = { queued: 0, inprocess: 0, total: 0, success: 0, error: 0 };
    const { forceBroadcast } = await import('@/lib/aggressive-sse-optimizer');
    forceBroadcast('upload_queue_update', {
      type: 'queue',
      data: [], // Empty data array
      total: 0,
      summary: fallbackSummary,
      pagination: {
        page: 1,
        limit: 20,
        offset: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false
      },
      timestamp: new Date().toISOString()
    });
  } finally {
    if (client) {
      client.release();
    }
  }
} 
