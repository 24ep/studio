import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

import { auth } from '@/auth';
import {
  buildUploadQueueDataQueryParts,
  buildUploadQueuePagination,
  normalizeUploadQueueSummary,
  parseUploadQueueDataFilters,
} from './upload-queue-data-query';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const filters = parseUploadQueueDataFilters(request);

    // Use connection pool efficiently
    const pool = getPool();
    const client = await pool.connect();

    try {
      const {
        countValues,
        limitIdx,
        offsetIdx,
        queryValues,
        whereClause,
      } = buildUploadQueueDataQueryParts(filters);

      // Get upload queue data - fixed query structure, no string interpolation from user input
      const res = await client.query(
        `SELECT uq.*, p.title as position_title 
         FROM upload_queue uq 
         LEFT JOIN "Position" p ON uq.position_id = p.id 
         ${whereClause} ORDER BY uq.upload_date DESC LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
        queryValues
      );

      // Get count
      const countRes = await client.query(
        `SELECT COUNT(*) 
         FROM upload_queue uq 
         LEFT JOIN "Position" p ON uq.position_id = p.id 
         ${whereClause}`,
        countValues
      );

      // Get summary
      const summaryRes = await client.query(
        `SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE uq.status = 'queued') as queued,
          COUNT(*) FILTER (WHERE uq.status = 'inprocess') as inprocess,
          COUNT(*) FILTER (WHERE uq.status = 'success') as success,
          COUNT(*) FILTER (WHERE uq.status = 'failed') as error
        FROM upload_queue uq 
        LEFT JOIN "Position" p ON uq.position_id = p.id 
        ${whereClause}`,
        countValues
      );

      const safeSummary = normalizeUploadQueueSummary(summaryRes.rows[0]);

      const total = Number(countRes.rows[0]?.count) || 0;

      return NextResponse.json({
        jobs: res.rows,
        total,
        summary: safeSummary,
        statusSummary: safeSummary,
        pagination: buildUploadQueuePagination(filters, total)
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('[UPLOAD QUEUE DATA] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch upload queue data' },
      { status: 500 }
    );
  }
}
