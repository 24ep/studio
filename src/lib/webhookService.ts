import prisma from './prisma';
import type { Webhook } from '@prisma/client';
import type { WebhookData } from './webhook/webhook-dispatcher-types';
import { isDemoInstallation } from './installation-environment';
import {
  sendServiceWebhook,
  type WebhookDeliveryResult,
} from './webhook/webhook-service-delivery';
import {
  createServiceApplicantPayload,
  createServiceCommentPayload,
  createServicePositionPayload,
  createServiceUploadQueuePayload,
  createServiceUserPayload,
} from './webhook/webhook-service-payloads';

export type { WebhookDeliveryResult };

export class WebhookService {
  static async sendWebhooks(event: string, data: WebhookData): Promise<void> {
    try {
      if (await isDemoInstallation()) return;
      const webhooks = await prisma.webhook.findMany({
        where: {
          is_active: true,
          events: {
            has: event,
          },
        },
      });

      await sendServiceWebhooks(webhooks, event, data);
    } catch (error) {
      console.error('Error sending webhooks:', error);
    }
  }

  static async sendWebhook(webhook: Webhook, event: string, data: WebhookData): Promise<WebhookDeliveryResult> {
    return sendServiceWebhook(webhook, event, data);
  }

  static async sendApplicantWebhook(event: string, applicant: WebhookData): Promise<void> {
    await this.sendWebhooks(event, createServiceApplicantPayload(applicant));
  }

  static async sendPositionWebhook(event: string, position: WebhookData): Promise<void> {
    await this.sendWebhooks(event, createServicePositionPayload(position));
  }

  static async sendUserWebhook(event: string, user: WebhookData): Promise<void> {
    await this.sendWebhooks(event, createServiceUserPayload(user));
  }

  static async sendUploadQueueWebhook(event: string, uploadQueue: WebhookData): Promise<void> {
    await this.sendWebhooks(event, createServiceUploadQueuePayload(uploadQueue));
  }

  static async sendCommentWebhook(event: string, comment: WebhookData): Promise<void> {
    await this.sendWebhooks(event, createServiceCommentPayload(comment));
  }

  static async sendCustomWebhook(event: string, data: WebhookData): Promise<void> {
    await this.sendWebhooks(event, data);
  }
}

async function sendServiceWebhooks(webhooks: Webhook[], event: string, data: WebhookData) {
  if (webhooks.length === 0) return;

  await Promise.allSettled(
    webhooks.map(webhook => WebhookService.sendWebhook(webhook, event, data))
  );
}
