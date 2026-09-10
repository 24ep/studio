import type { Prisma } from '@prisma/client';
import prisma from './prisma';
import {
  getWebhookEventFields,
  getWebhookSamplePayload,
} from './webhook/webhook-event-fields';
import {
  processWebhookBodyTemplate,
  validateJsonTemplate,
} from './webhook/webhook-body-template';
import type {
  FieldMapping,
  ProcessedWebhookPayload,
  WebhookBodyConfig,
} from './webhook/webhook-body-types';
import type { WebhookData } from './webhook/webhook-dispatcher-types';

export type { FieldMapping, ProcessedWebhookPayload, WebhookBodyConfig };

type WebhookWithBodyConfigs = Prisma.WebhookGetPayload<{
  include: {
    body_configs: true;
  };
}>;

type PayloadWebhookMetadata = {
  include_metadata?: boolean | null;
  name?: string | null;
};

export class WebhookBodyProcessor {
  static async processWebhookPayload(
    webhookId: string,
    event: string,
    data: WebhookData
  ): Promise<ProcessedWebhookPayload> {
    try {
      const webhook: WebhookWithBodyConfigs | null = await prisma.webhook.findUnique({
        where: { id: webhookId },
        include: {
          body_configs: {
            where: { event_type: event, is_active: true },
          },
        },
      });

      if (!webhook) {
        throw new Error(`Webhook ${webhookId} not found`);
      }

      if (!webhook.custom_payload) {
        return createDefaultPayload(event, data, webhookId, webhook);
      }

      const bodyConfig = webhook.body_configs[0];
      if (bodyConfig) {
        return processWebhookBodyTemplate(
          bodyConfig.body_template,
          event,
          data,
          webhook,
          parseFieldMappings(bodyConfig.field_mappings)
        );
      }

      if (webhook.body_template) {
        return processWebhookBodyTemplate(webhook.body_template, event, data, webhook);
      }

      return createDefaultPayload(event, data, webhookId);
    } catch (error) {
      console.error('Error processing webhook payload:', error);
      return createFallbackPayload(event, data, webhookId);
    }
  }

  static getAvailableFields(eventType: string): string[] {
    return getWebhookEventFields(eventType);
  }

  static validateTemplate(template: string): { isValid: boolean; error?: string } {
    return validateJsonTemplate(template);
  }

  static getSamplePayload(eventType: string): WebhookData {
    return getWebhookSamplePayload(eventType);
  }
}

function createDefaultPayload(
  event: string,
  data: WebhookData,
  webhookId: string,
  webhook?: PayloadWebhookMetadata
): ProcessedWebhookPayload {
  return {
    event,
    timestamp: new Date().toISOString(),
    data,
    webhook_id: webhookId,
    metadata: webhook?.include_metadata ? {
      webhook_name: webhook.name,
      event_type: event,
      processed_at: new Date().toISOString(),
    } : undefined,
  };
}

function createFallbackPayload(
  event: string,
  data: WebhookData,
  webhookId: string
): ProcessedWebhookPayload {
  return {
    event,
    timestamp: new Date().toISOString(),
    data,
    webhook_id: webhookId,
    metadata: { error: 'Payload processing failed' },
  };
}

function isFieldMapping(value: unknown): value is FieldMapping {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }

  const mapping = value as Partial<FieldMapping>;
  return typeof mapping.source_field === 'string' && typeof mapping.target_field === 'string';
}

function parseFieldMappings(fieldMappings: Prisma.JsonValue | null): FieldMapping[] | undefined {
  if (!fieldMappings) {
    return undefined;
  }

  if (!Array.isArray(fieldMappings)) {
    return [];
  }

  return fieldMappings.reduce<FieldMapping[]>((mappings, mapping) => {
    if (isFieldMapping(mapping)) {
      mappings.push(mapping);
    }
    return mappings;
  }, []);
}
