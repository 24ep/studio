import type { WebhookData } from '../webhookDispatcher';

function getRecordValue(value: unknown, key: string) {
  return value && typeof value === 'object' ? (value as Record<string, unknown>)[key] : undefined;
}

export function getUploadQueueSourceInfo(uploadQueue: WebhookData) {
  const webhookPayload = uploadQueue.webhook_payload;
  if (!webhookPayload || typeof webhookPayload !== 'object') {
    return null;
  }

  return {
    sourceId: getRecordValue(webhookPayload, 'sourceId') || null,
    targetPositionId: getRecordValue(webhookPayload, 'targetPositionId') || null,
  };
}

export function buildApplicantStageChangedPayload(
  applicant: WebhookData,
  oldStage: string,
  newStage: string,
  changedAt = new Date().toISOString(),
) {
  return {
    applicant: {
      id: applicant.id,
      name: applicant.name,
      email: applicant.email,
      status: applicant.statusId || applicant.status || applicant.statusName || 'Unknown',
      position_id: applicant.positionId,
      application_date: applicant.applicationDate,
      createdAt: applicant.createdAt,
      updatedAt: applicant.updatedAt,
    },
    stage_change: {
      old_stage: oldStage,
      new_stage: newStage,
      changed_at: changedAt,
    },
  };
}

export function buildResumePayload(resume: WebhookData) {
  return {
    id: resume.id,
    applicant_id: resume.applicantId,
    file_name: resume.fileName,
    file_path: resume.filePath,
    uploaded_at: resume.uploadedAt,
    file_size: resume.fileSize,
  };
}

export function buildUploadQueuePayload(uploadQueue: WebhookData) {
  return {
    id: uploadQueue.id,
    file_name: uploadQueue.fileName,
    file_size: uploadQueue.fileSize,
    status: uploadQueue.status,
    error: uploadQueue.error,
    upload_date: uploadQueue.uploadDate,
    completed_date: uploadQueue.completedDate,
    createdAt: uploadQueue.createdAt,
    source: getUploadQueueSourceInfo(uploadQueue),
  };
}

export function buildUploadQueueRetryPayload(
  uploadQueue: WebhookData,
  attempt: number,
  retryAt = new Date().toISOString(),
) {
  return {
    upload_queue: buildUploadQueuePayload(uploadQueue),
    retry: {
      attempt,
      retry_at: retryAt,
    },
  };
}
