import type { WebhookData } from './webhook-dispatcher-types';

function getRecordValue(value: unknown, key: string) {
  return value && typeof value === 'object' ? (value as Record<string, unknown>)[key] : undefined;
}

export function createServiceApplicantPayload(applicant: WebhookData) {
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
  };
}

export function createServicePositionPayload(position: WebhookData) {
  return {
    position: {
      id: position.id,
      title: position.title,
      department: position.department,
      description: position.description,
      is_open: position.isOpen,
      createdAt: position.createdAt,
      updatedAt: position.updatedAt,
    },
  };
}

export function createServiceUserPayload(user: WebhookData) {
  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
  };
}

export function createServiceUploadQueuePayload(uploadQueue: WebhookData) {
  return {
    upload_queue: {
      id: uploadQueue.id,
      file_name: uploadQueue.fileName,
      file_size: uploadQueue.fileSize,
      status: uploadQueue.status,
      error: uploadQueue.error,
      upload_date: uploadQueue.uploadDate,
      completed_date: uploadQueue.completedDate,
      createdAt: uploadQueue.createdAt,
      source: getUploadQueueSourceInfo(uploadQueue),
    },
  };
}

export function createServiceCommentPayload(comment: WebhookData) {
  return {
    comment: {
      id: comment.id,
      content: comment.content,
      author_id: comment.authorId,
      applicant_id: comment.applicantId,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
    },
  };
}

function getUploadQueueSourceInfo(uploadQueue: WebhookData) {
  const webhookPayload = uploadQueue.webhook_payload;
  if (!webhookPayload || typeof webhookPayload !== 'object') {
    return null;
  }

  return {
    sourceId: getRecordValue(webhookPayload, 'sourceId') || null,
    targetPositionId: getRecordValue(webhookPayload, 'targetPositionId') || null,
  };
}
