import { v4 as uuidv4 } from 'uuid';
import {
  resolveReprocessPositionId,
  selectReprocessAttachment,
} from './bulk-action-route-utils';
import type { BulkActionExecutionContext, BulkActionExecutionResult } from './bulk-action-route-types';

type ReprocessAttachmentRow = {
  id: string;
  filePath: string;
  fileName: string;
  label: string | null;
  isPrimary: boolean;
};

type ReprocessApplicantRow = {
  id: string;
  name: string;
  positionId: string | null;
  sourceId: string | null;
  parsedData: {
    job_applied?: {
      jobId?: string | null;
    } | null;
  } | null;
  attachments: ReprocessAttachmentRow[];
};

export async function executeReprocessBulkAction(
  context: BulkActionExecutionContext
): Promise<BulkActionExecutionResult> {
  const { client, data, actingUserId } = context;
  const applicantsResult = await client.query<ReprocessApplicantRow>(`
    SELECT 
      c.id,
      c.name,
      c."positionId",
      c."sourceId",
      c."parsedData",
      COALESCE(
        json_agg(
          json_build_object(
            'id', a.id,
            'filePath', a."filePath",
            'fileName', a."fileName",
            'label', a.label,
            'isPrimary', a."isPrimary"
          ) ORDER BY 
          CASE WHEN a.label = 'resume' THEN 1 ELSE 2 END,
          a."isPrimary" DESC,
          a."createdAt" ASC
        ) FILTER (WHERE a.id IS NOT NULL),
        '[]'::json
      ) as attachments
    FROM "Applicant" c
    LEFT JOIN "Attachment" a ON c.id = a."applicantId"
    WHERE c.id = ANY($1::uuid[])
    GROUP BY c.id, c.name, c."positionId", c."sourceId", c."parsedData"
  `, [data.applicantIds]);

  const reprocessResults: Record<string, unknown>[] = [];
  const reprocessErrors: Record<string, unknown>[] = [];

  for (const applicant of applicantsResult.rows) {
    try {
      const selectedAttachment = selectReprocessAttachment(applicant.attachments || []);

      if (!selectedAttachment) {
        reprocessErrors.push({
          applicantId: applicant.id,
          applicantName: applicant.name,
          error: 'No attachments found for re-processing',
        });
        continue;
      }

      const appliedPositionId = resolveReprocessPositionId(applicant);
      if (!appliedPositionId) {
        reprocessErrors.push({
          applicantId: applicant.id,
          applicantName: applicant.name,
          error: 'No applied position found for re-processing',
        });
        continue;
      }

      const jobId = uuidv4();
      const uploadId = uuidv4();

      await client.query(`
        INSERT INTO upload_queue (
          id, file_name, file_size, status, source, upload_id, 
          created_by, file_path, webhook_payload, position_id, source_id, sub_source
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      `, [
        jobId,
        selectedAttachment.fileName,
        0,
        'queued',
        'reprocess',
        uploadId,
        actingUserId,
        selectedAttachment.filePath,
        JSON.stringify({
          Applicant_id: applicant.id,
          request_type: 'update',
          source: 'reprocess',
          attachment_id: selectedAttachment.id,
          sourceId: applicant.sourceId,
        }),
        appliedPositionId,
        applicant.sourceId,
        null,
      ]);

      reprocessResults.push({
        applicantId: applicant.id,
        applicantName: applicant.name,
        attachmentName: selectedAttachment.fileName,
        positionId: appliedPositionId,
        jobId,
      });
    } catch (error) {
      console.error(`Error creating reprocess job for applicant ${applicant.id}:`, error);
      reprocessErrors.push({
        applicantId: applicant.id,
        applicantName: applicant.name,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return {
    result: {
      reprocessedCount: reprocessResults.length,
      errorCount: reprocessErrors.length,
      reprocessResults,
      reprocessErrors,
    },
    auditMessage: `Bulk re-processed ${reprocessResults.length} Applicants, ${reprocessErrors.length} failed`,
  };
}
