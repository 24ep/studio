import { WebhookService } from './webhookService';
import type { WebhookData } from './webhookDispatcher';
import {
  buildApplicantStageChangedPayload,
  buildResumePayload,
  buildUploadQueuePayload,
  buildUploadQueueRetryPayload,
} from './webhook/webhook-event-emitter-payloads';

/**
 * Webhook Event Emitter
 * Provides easy-to-use methods to trigger webhooks for various system events
 */
export class WebhookEvents {
  /**
   * Applicant Events
   */
  static async ApplicantCreated(applicant: WebhookData): Promise<void> {
    await WebhookService.sendApplicantWebhook('Applicant.created', applicant);
  }

  static async ApplicantUpdated(applicant: WebhookData): Promise<void> {
    await WebhookService.sendApplicantWebhook('Applicant.updated', applicant);
  }

  static async ApplicantDeleted(applicant: WebhookData): Promise<void> {
    await WebhookService.sendApplicantWebhook('Applicant.deleted', applicant);
  }

  static async ApplicantstageChanged(applicant: WebhookData, oldStage: string, newStage: string): Promise<void> {
    await WebhookService.sendWebhooks(
      'Applicant.stage_changed',
      buildApplicantStageChangedPayload(applicant, oldStage, newStage),
    );
  }

  /**
   * Position Events
   */
  static async positionCreated(position: WebhookData): Promise<void> {
    await WebhookService.sendPositionWebhook('position.created', position);
  }

  static async positionUpdated(position: WebhookData): Promise<void> {
    await WebhookService.sendPositionWebhook('position.updated', position);
  }

  static async positionDeleted(position: WebhookData): Promise<void> {
    await WebhookService.sendPositionWebhook('position.deleted', position);
  }

  /**
   * User Events
   */
  static async userCreated(user: WebhookData): Promise<void> {
    await WebhookService.sendUserWebhook('user.created', user);
  }

  static async userUpdated(user: WebhookData): Promise<void> {
    await WebhookService.sendUserWebhook('user.updated', user);
  }

  static async userDeleted(user: WebhookData): Promise<void> {
    await WebhookService.sendUserWebhook('user.deleted', user);
  }

  /**
   * Resume Events
   */
  static async resumeUploaded(resume: WebhookData): Promise<void> {
    await WebhookService.sendWebhooks('resume.uploaded', {
      resume: buildResumePayload(resume),
    });
  }

  static async resumeProcessed(resume: WebhookData, processingResult: unknown): Promise<void> {
    await WebhookService.sendWebhooks('resume.processed', {
      resume: buildResumePayload(resume),
      processing_result: processingResult
    });
  }

  /**
   * Comment Events
   */
  static async commentCreated(comment: WebhookData): Promise<void> {
    await WebhookService.sendCommentWebhook('comment.created', comment);
  }

  static async commentUpdated(comment: WebhookData): Promise<void> {
    await WebhookService.sendCommentWebhook('comment.updated', comment);
  }

  static async commentDeleted(comment: WebhookData): Promise<void> {
    await WebhookService.sendCommentWebhook('comment.deleted', comment);
  }

  /**
   * Upload Queue Events
   */
  static async uploadQueueCreated(uploadQueue: WebhookData): Promise<void> {
    await WebhookService.sendUploadQueueWebhook('upload_queue.created', uploadQueue);
  }

  static async uploadQueueProcessing(uploadQueue: WebhookData): Promise<void> {
    await WebhookService.sendUploadQueueWebhook('upload_queue.processing', uploadQueue);
  }

  static async uploadQueueCompleted(uploadQueue: WebhookData): Promise<void> {
    await WebhookService.sendUploadQueueWebhook('upload_queue.completed', uploadQueue);
  }

  static async uploadQueueFailed(uploadQueue: WebhookData, error: string): Promise<void> {
    await WebhookService.sendWebhooks('upload_queue.failed', {
      upload_queue: buildUploadQueuePayload(uploadQueue),
      error: error
    });
  }

  static async uploadQueueRetry(uploadQueue: WebhookData, attempt: number): Promise<void> {
    await WebhookService.sendWebhooks(
      'upload_queue.retry',
      buildUploadQueueRetryPayload(uploadQueue, attempt),
    );
  }

  /**
   * Custom Event
   */
  static async sendCustomEvent(event: string, data: WebhookData): Promise<void> {
    await WebhookService.sendWebhooks(event, data);
  }
}

/**
 * Webhook Event Decorator
 * Can be used to automatically trigger webhooks after database operations
 */
export function withWebhookEvent(eventType: string) {
  return function (
    _target: object,
    _propertyName: string | symbol,
    descriptor: TypedPropertyDescriptor<(...args: unknown[]) => unknown | Promise<unknown>>
  ) {
    const method = descriptor.value;
    if (!method) {
      return;
    }

    descriptor.value = async function (this: unknown, ...args: unknown[]) {
      const result = await method.apply(this, args);
      
      // Trigger webhook after successful operation
      try {
        if (result && typeof result === 'object') {
          await WebhookEvents.sendCustomEvent(eventType, result as WebhookData);
        }
      } catch (error) {
        console.error(`Error sending webhook for event ${eventType}:`, error);
      }

      return result;
    };
  };
} 
