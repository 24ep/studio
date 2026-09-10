import { areWebhooksEnabled } from './webhookConfig';
import { createDispatchWebhooks } from './webhook/webhook-dispatch-shortcuts';
import {
  checkDispatcherRateLimits,
  findActiveEventWebhooks,
} from './webhook/webhook-dispatcher-repository';
import type { WebhookData, WebhookPayload, WebhookResult } from './webhook/webhook-dispatcher-types';
import { sendWebhookDelivery } from './webhook/webhook-delivery';
import { isDemoInstallation } from './installation-environment';
import {
  createApplicantEventData,
  createCommentEventData,
  createPositionEventData,
  createResumeEventData,
  createUploadQueueEventData,
  createUserEventData,
  markUploadQueueItemProcessedByExternalWebhook,
} from './webhook/webhook-event-payloads';

export type { WebhookData, WebhookPayload, WebhookResult };

export class WebhookDispatcher {
  private static instance: WebhookDispatcher;
  private isProcessing = false;

  private constructor() {}

  static getInstance(): WebhookDispatcher {
    if (!WebhookDispatcher.instance) {
      WebhookDispatcher.instance = new WebhookDispatcher();
    }
    return WebhookDispatcher.instance;
  }

  async dispatch(event: string, data: WebhookData): Promise<WebhookResult[]> {
    if (this.isProcessing || !areWebhooksEnabled() || await isDemoInstallation()) {
      return [];
    }

    this.isProcessing = true;

    try {
      const rateLimitResult = await checkDispatcherRateLimits();
      if (rateLimitResult) {
        return [rateLimitResult];
      }

      const webhooks = await findActiveEventWebhooks(event);
      if (webhooks.length === 0) {
        return [];
      }

      const webhookResults = await Promise.allSettled(
        webhooks.map(webhook => sendWebhookDelivery(webhook, event, data))
      );

      return collectWebhookResults(webhooks, webhookResults);
    } finally {
      this.isProcessing = false;
    }
  }

  async dispatchApplicantEvent(event: string, applicant: WebhookData, additionalData?: WebhookData) {
    return this.dispatch(event, createApplicantEventData(applicant, additionalData));
  }

  async dispatchPositionEvent(event: string, position: WebhookData, additionalData?: WebhookData) {
    return this.dispatch(event, createPositionEventData(position, additionalData));
  }

  async dispatchUserEvent(event: string, user: WebhookData, additionalData?: WebhookData) {
    return this.dispatch(event, createUserEventData(user, additionalData));
  }

  async dispatchResumeEvent(event: string, resume: WebhookData, applicant: WebhookData, additionalData?: WebhookData) {
    return this.dispatch(event, createResumeEventData(resume, applicant, additionalData));
  }

  async dispatchCommentEvent(event: string, comment: WebhookData, additionalData?: WebhookData) {
    return this.dispatch(event, createCommentEventData(comment, additionalData));
  }

  async dispatchUploadQueueEvent(event: string, uploadQueueItem: WebhookData, additionalData?: WebhookData) {
    await markUploadQueueItemProcessedByExternalWebhook(event, uploadQueueItem);
    return this.dispatch(event, createUploadQueueEventData(uploadQueueItem, additionalData));
  }
}

function collectWebhookResults(
  webhooks: Array<{ id: string }>,
  webhookResults: PromiseSettledResult<WebhookResult>[]
): WebhookResult[] {
  return webhookResults.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    }

    return {
      webhook_id: webhooks[index].id,
      success: false,
      error: result.reason?.message || 'Unknown error',
      duration_ms: 0,
    };
  });
}

export const webhookDispatcher = WebhookDispatcher.getInstance();
export const dispatchWebhooks = createDispatchWebhooks(webhookDispatcher);
