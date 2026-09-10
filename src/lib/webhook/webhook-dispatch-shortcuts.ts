import type { WebhookDispatcher } from '../webhookDispatcher';
import type { WebhookData } from './webhook-dispatcher-types';

export function createDispatchWebhooks(webhookDispatcher: WebhookDispatcher) {
  return {
    ApplicantCreated: (applicant: WebhookData) => webhookDispatcher.dispatchApplicantEvent('Applicant.created', applicant),
    ApplicantUpdated: (applicant: WebhookData) => webhookDispatcher.dispatchApplicantEvent('Applicant.updated', applicant),
    ApplicantDeleted: (applicant: WebhookData) => webhookDispatcher.dispatchApplicantEvent('Applicant.deleted', applicant),
    ApplicantstageChanged: (applicant: WebhookData, oldStage: string, newStage: string) =>
      webhookDispatcher.dispatchApplicantEvent('Applicant.stage_changed', applicant, {
        old_stage: oldStage,
        new_stage: newStage,
      }),

    positionCreated: (position: WebhookData) => webhookDispatcher.dispatchPositionEvent('position.created', position),
    positionUpdated: (position: WebhookData) => webhookDispatcher.dispatchPositionEvent('position.updated', position),
    positionDeleted: (position: WebhookData) => webhookDispatcher.dispatchPositionEvent('position.deleted', position),

    userCreated: (user: WebhookData) => webhookDispatcher.dispatchUserEvent('user.created', user),
    userUpdated: (user: WebhookData) => webhookDispatcher.dispatchUserEvent('user.updated', user),
    userDeleted: (user: WebhookData) => webhookDispatcher.dispatchUserEvent('user.deleted', user),

    resumeUploaded: (resume: WebhookData, applicant: WebhookData) =>
      webhookDispatcher.dispatchResumeEvent('resume.uploaded', resume, applicant),
    resumeProcessed: (resume: WebhookData, applicant: WebhookData, processingResult: unknown) =>
      webhookDispatcher.dispatchResumeEvent('resume.processed', resume, applicant, {
        processing_result: processingResult,
      }),

    commentCreated: (comment: WebhookData) => webhookDispatcher.dispatchCommentEvent('comment.created', comment),
    commentUpdated: (comment: WebhookData) => webhookDispatcher.dispatchCommentEvent('comment.updated', comment),
    commentDeleted: (comment: WebhookData) => webhookDispatcher.dispatchCommentEvent('comment.deleted', comment),

    uploadQueueCreated: (uploadQueueItem: WebhookData) =>
      webhookDispatcher.dispatchUploadQueueEvent('upload_queue.created', uploadQueueItem),
    uploadQueueProcessing: (uploadQueueItem: WebhookData) =>
      webhookDispatcher.dispatchUploadQueueEvent('upload_queue.processing', uploadQueueItem),
    uploadQueueCompleted: (uploadQueueItem: WebhookData, result?: unknown) =>
      webhookDispatcher.dispatchUploadQueueEvent('upload_queue.completed', uploadQueueItem, {
        processing_result: result,
      }),
    uploadQueueFailed: (uploadQueueItem: WebhookData, error?: unknown) =>
      webhookDispatcher.dispatchUploadQueueEvent('upload_queue.failed', uploadQueueItem, {
        error_details: error,
      }),
    uploadQueueRetry: (uploadQueueItem: WebhookData, attempt: number) =>
      webhookDispatcher.dispatchUploadQueueEvent('upload_queue.retry', uploadQueueItem, {
        retry_attempt: attempt,
      }),
  };
}
