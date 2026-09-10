import { type NextRequest, NextResponse } from 'next/server';
import { getPool, restoreDefaultStatementTimeout } from '@/lib/db';
import { requireUploadQueueSession } from './upload-queue-route-auth';
import { attachUploadQueueFileUrls, buildUploadQueueQuery, createUploadQueueReadErrorResponse } from './upload-queue-route-query';
import type { DbClient } from '@/lib/db';
import type { QueryResultRow } from 'pg';

type UploadQueueListRow = QueryResultRow & {
  file_path?: string | null;
};

type UploadQueueSummaryRow = QueryResultRow & {
  total: string | number;
  queued: string | number;
  inprocess: string | number;
  success: string | number;
  error: string | number;
};

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export async function handleUploadQueueGet(request: NextRequest) {
  const authorization = await requireUploadQueueSession();
  if (!authorization.ok) {
    return authorization.response;
  }

  const query = buildUploadQueueQuery(request);
  const dataValues = [...query.filterValues, query.safeLimit, query.safeOffset];

  let client: DbClient | null = null;
  try {
    client = await getPool().connect();
  } catch (connectionError) {
    console.error('[Upload Queue API] Failed to connect to database:', connectionError);
    return NextResponse.json({
      error: 'Database connection error',
      details: getErrorMessage(connectionError),
    }, { status: 500 });
  }

  try {
    await client.query('SET statement_timeout = \'60000ms\'');

    const dataRes = await client.query<UploadQueueListRow>(
      `SELECT
         uq.*,
         p.title as position_title,
         cs.name as source_name,
         cs.logo as source_logo,
         COALESCE(payload_applicant.id, resume_applicant.id, attachment_applicant.id) as applicant_id,
         COALESCE(payload_applicant.name, resume_applicant.name, attachment_applicant.name) as applicant_name
       FROM upload_queue uq
       LEFT JOIN "Position" p ON uq.position_id = p.id
       LEFT JOIN "ApplicantSource" cs ON uq.source_id = cs.id
       LEFT JOIN LATERAL (
         SELECT COALESCE(
           uq.webhook_payload->>'applicant_id',
           uq.webhook_payload->>'applicantId',
           uq.webhook_payload->>'Applicant_id',
           uq.webhook_payload#>>'{applicant,id}'
         ) as applicant_id
       ) payload_ref ON true
       LEFT JOIN "Applicant" payload_applicant ON payload_applicant.id = (
         CASE
           WHEN payload_ref.applicant_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
           THEN payload_ref.applicant_id::uuid
           ELSE NULL
         END
       )
       LEFT JOIN LATERAL (
         SELECT a.id, a.name
         FROM "Applicant" a
         WHERE a."resumePath" = uq.file_path
         ORDER BY a."updatedAt" DESC
         LIMIT 1
       ) resume_applicant ON true
       LEFT JOIN LATERAL (
         SELECT a.id, a.name
         FROM "Attachment" att
         JOIN "Applicant" a ON a.id = att."applicantId"
         WHERE att."filePath" = uq.file_path
         ORDER BY att."isPrimary" DESC, att."uploadedAt" DESC
         LIMIT 1
       ) attachment_applicant ON true
       ${query.whereSQL}
       ORDER BY ${query.safeSortExpr} ${query.sortDirection}
       LIMIT $${query.limitParamIndex} OFFSET $${query.offsetParamIndex}`,
      dataValues
    );

    const summaryRes = await client.query<UploadQueueSummaryRow>(
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

    const summary = summaryRes.rows[0];
    const totalCount = parseInt(String(summary.total), 10);
    const jobsWithUrl = await attachUploadQueueFileUrls(dataRes.rows);

    return NextResponse.json({
      data: jobsWithUrl,
      total: totalCount,
      summary: {
        total: totalCount,
        queued: Number(summary.queued) || 0,
        inprocess: Number(summary.inprocess) || 0,
        success: Number(summary.success) || 0,
        error: Number(summary.error) || 0,
      },
      pagination: {
        page: Math.floor(query.safeOffset / query.safeLimit) + 1,
        limit: query.safeLimit,
        offset: query.safeOffset,
        totalPages: Math.ceil(totalCount / query.safeLimit),
        hasNextPage: query.safeOffset + query.safeLimit < totalCount,
        hasPrevPage: query.safeOffset > 0,
      },
    });
  } catch (error) {
    return createUploadQueueReadErrorResponse(error);
  } finally {
    if (client) {
      try {
        await restoreDefaultStatementTimeout(client);
      } finally {
        client.release();
      }
    }
  }
}
