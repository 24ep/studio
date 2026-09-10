const UPLOAD_QUEUE_TERMINAL_EVENTS = new Set(['upload_queue.completed', 'upload_queue.failed']);

import type { WebhookData } from './webhook-dispatcher-types';

function getStringId(value: unknown) {
  return typeof value === 'string' && value.trim() !== '' ? value : null;
}

export function createApplicantEventData(applicant: WebhookData, additionalData?: WebhookData) {
  return {
    applicant: {
      id: applicant.id,
      name: applicant.name,
      email: applicant.email,
      phone: applicant.phone,
      current_stage: applicant.current_stage,
      createdAt: applicant.createdAt,
      updatedAt: applicant.updatedAt,
    },
    ...additionalData,
  };
}

export function createPositionEventData(position: WebhookData, additionalData?: WebhookData) {
  return {
    position: {
      id: position.id,
      title: position.title,
      department: position.department,
      description: position.description,
      status: position.status,
      createdAt: position.createdAt,
      updatedAt: position.updatedAt,
    },
    ...additionalData,
  };
}

export function createUserEventData(user: WebhookData, additionalData?: WebhookData) {
  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
    ...additionalData,
  };
}

export function createResumeEventData(resume: WebhookData, applicant: WebhookData, additionalData?: WebhookData) {
  return {
    resume: {
      id: resume.id,
      filename: resume.filename,
      file_size: resume.file_size,
      mime_type: resume.mime_type,
      uploaded_at: resume.uploaded_at,
    },
    applicant: {
      id: applicant.id,
      name: applicant.name,
      email: applicant.email,
    },
    ...additionalData,
  };
}

export function createCommentEventData(comment: WebhookData, additionalData?: WebhookData) {
  return {
    comment: {
      id: comment.id,
      content: comment.content,
      author_id: comment.author_id,
      author_name: comment.author_name,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
    },
    ...additionalData,
  };
}

export async function markUploadQueueItemProcessedByExternalWebhook(
  event: string,
  uploadQueueItem: WebhookData
) {
  const uploadQueueItemId = getStringId(uploadQueueItem.id);
  if (!uploadQueueItemId || !UPLOAD_QUEUE_TERMINAL_EVENTS.has(event)) {
    return;
  }

  try {
    const pool = await import('@/lib/db').then(m => m.getPool());
    const client = await pool.connect();
    try {
      await client.query(
        `UPDATE upload_queue SET webhook_payload = jsonb_set(
          COALESCE(webhook_payload, '{}'::jsonb),
          '{processed_by_external_webhook}',
          'true'::jsonb
        ) WHERE id = $1`,
        [uploadQueueItemId]
      );
    } finally {
      client.release();
    }
  } catch (error) {
    console.error(`[Webhook] Failed to mark job ${uploadQueueItemId} as processed:`, error);
  }
}

export function createUploadQueueEventData(uploadQueueItem: WebhookData, additionalData?: WebhookData) {
  const { sourceId, subSource } = getUploadQueueSource(uploadQueueItem);

  return {
    upload_queue: {
      id: uploadQueueItem.id,
      file_name: uploadQueueItem.file_name || uploadQueueItem.fileName,
      file_size: uploadQueueItem.file_size || uploadQueueItem.fileSize,
      status: uploadQueueItem.status,
      error: uploadQueueItem.error,
      error_details: uploadQueueItem.error_details || uploadQueueItem.errorDetails,
      source: uploadQueueItem.source,
      source_id: sourceId,
      sub_source: subSource,
      upload_date: uploadQueueItem.upload_date || uploadQueueItem.uploadDate,
      completed_date: uploadQueueItem.completed_date || uploadQueueItem.completedDate,
      file_path: uploadQueueItem.file_path || uploadQueueItem.filePath,
      position_id: uploadQueueItem.position_id || uploadQueueItem.positionId,
      created_by: uploadQueueItem.created_by || uploadQueueItem.createdBy,
      webhook_payload: uploadQueueItem.webhook_payload || uploadQueueItem.webhookPayload,
    },
    ...additionalData,
  };
}

function getUploadQueueSource(uploadQueueItem: WebhookData) {
  let sourceId = uploadQueueItem.source_id || uploadQueueItem.sourceId;
  const subSource = uploadQueueItem.sub_source || uploadQueueItem.subSource;

  if (!sourceId && uploadQueueItem.webhook_payload && typeof uploadQueueItem.webhook_payload === 'object') {
    sourceId = (uploadQueueItem.webhook_payload as WebhookData).sourceId || null;
  }

  return { sourceId, subSource };
}
