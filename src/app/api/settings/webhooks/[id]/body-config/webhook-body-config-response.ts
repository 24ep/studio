import type { Prisma } from '@prisma/client';

type WebhookBodyConfigPageWebhook = Prisma.WebhookGetPayload<{
  select: {
    id: true;
    name: true;
    body_template: true;
    field_mappings: true;
    include_metadata: true;
    custom_payload: true;
    events: true;
  };
}>;

type WebhookBodyConfigRow = Prisma.WebhookBodyConfigGetPayload<object>;

export function serializeWebhookBodyConfigPage(webhook: WebhookBodyConfigPageWebhook, bodyConfigs: WebhookBodyConfigRow[]) {
  return {
    webhook: {
      id: webhook.id,
      name: webhook.name,
      body_template: webhook.body_template,
      field_mappings: webhook.field_mappings,
      include_metadata: webhook.include_metadata,
      custom_payload: webhook.custom_payload,
      events: webhook.events,
    },
    body_configs: bodyConfigs.map(config => ({
      id: config.id,
      event_type: config.event_type,
      body_template: config.body_template,
      field_mappings: config.field_mappings,
      is_active: config.is_active,
      created_at: config.created_at,
      updated_at: config.updated_at,
    })),
  };
}
