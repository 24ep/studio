import { getPool } from '@/lib/db';
import { buildServerFileUrl } from '@/lib/fileUrls';
import type { UploadQueueV1Query } from './upload-queue-v1-query';

type UploadQueueRow = {
  file_path?: string | null;
  [key: string]: unknown;
};

function mapSummary(summary: Record<string, unknown>) {
  return {
    total: Number(summary.total) || 0,
    queued: Number(summary.queued) || 0,
    inprocess: Number(summary.inprocess) || 0,
    success: Number(summary.success) || 0,
    error: Number(summary.error) || 0,
  };
}

export async function fetchUploadQueueV1(query: UploadQueueV1Query) {
  const client = await getPool().connect();

  try {
    const dataRes = await client.query(
      `SELECT uq.*, p.title as position_title 
       FROM upload_queue uq 
       LEFT JOIN "Position" p ON uq.position_id = p.id 
       ${query.whereSQL} 
       ORDER BY uq.upload_date DESC 
       LIMIT $${query.limitParamIndex} OFFSET $${query.offsetParamIndex}`,
      query.paginationValues
    );

    const countRes = await client.query(
      `SELECT COUNT(*) 
       FROM upload_queue uq 
       LEFT JOIN "Position" p ON uq.position_id = p.id 
       ${query.whereSQL}`,
      query.filterValues
    );

    const summaryRes = await client.query(
      `SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE uq.status = 'queued') as queued,
        COUNT(*) FILTER (WHERE uq.status = 'inprocess') as inprocess,
        COUNT(*) FILTER (WHERE uq.status = 'success') as success,
        COUNT(*) FILTER (WHERE uq.status = 'failed') as error
      FROM upload_queue uq 
      LEFT JOIN "Position" p ON uq.position_id = p.id 
      ${query.whereSQL}`,
      query.filterValues
    );

    const rows = dataRes.rows as UploadQueueRow[];
    const data = await Promise.all(
      rows.map(async job => ({
        ...job,
        url: job.file_path ? await buildServerFileUrl(job.file_path, { strategy: 'stream' }) : null,
      }))
    );
    const total = Number(countRes.rows[0]?.count) || 0;

    return {
      data,
      total,
      summary: mapSummary(summaryRes.rows[0] || {}),
    };
  } finally {
    client.release();
  }
}
