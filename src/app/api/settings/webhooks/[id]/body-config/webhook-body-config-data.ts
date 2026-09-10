import prisma from '@/lib/prisma';
import type { BodyConfigInput, BodyConfigUpdateInput } from './webhook-body-config-schema';

export async function fetchWebhookBodyConfigPage(webhookId: string) {
  const [bodyConfigs, webhook] = await Promise.all([
    prisma.webhookBodyConfig.findMany({
      where: { webhook_id: webhookId },
      orderBy: { event_type: 'asc' },
    }),
    prisma.webhook.findUnique({
      where: { id: webhookId },
      select: {
        id: true,
        name: true,
        body_template: true,
        field_mappings: true,
        include_metadata: true,
        custom_payload: true,
        events: true,
      },
    }),
  ]);

  return { bodyConfigs, webhook };
}

export async function fetchWebhookEvents(webhookId: string) {
  return prisma.webhook.findUnique({
    where: { id: webhookId },
    select: { id: true, events: true },
  });
}

export async function upsertWebhookBodyConfig(webhookId: string, data: BodyConfigInput) {
  return prisma.webhookBodyConfig.upsert({
    where: {
      webhook_id_event_type: {
        webhook_id: webhookId,
        event_type: data.event_type,
      },
    },
    update: {
      body_template: data.body_template,
      field_mappings: data.field_mappings ?? undefined,
      is_active: data.is_active ?? true,
      updated_at: new Date(),
    },
    create: {
      webhook_id: webhookId,
      event_type: data.event_type,
      body_template: data.body_template,
      field_mappings: data.field_mappings ?? undefined,
      is_active: data.is_active ?? true,
    },
  });
}

export async function updateWebhookBodyCustomization(webhookId: string, data: BodyConfigUpdateInput) {
  return prisma.$transaction(async (tx) => {
    const webhook = await tx.webhook.update({
      where: { id: webhookId },
      data: {
        body_template: data.body_template,
        field_mappings: data.field_mappings,
        include_metadata: data.include_metadata,
        custom_payload: data.custom_payload,
        updatedAt: new Date(),
      },
    });

    for (const config of data.body_configs ?? []) {
      await tx.webhookBodyConfig.upsert({
        where: {
          webhook_id_event_type: {
            webhook_id: webhookId,
            event_type: config.event_type,
          },
        },
        update: {
          body_template: config.body_template,
          field_mappings: config.field_mappings ?? undefined,
          is_active: config.is_active ?? true,
          updated_at: new Date(),
        },
        create: {
          webhook_id: webhookId,
          event_type: config.event_type,
          body_template: config.body_template,
          field_mappings: config.field_mappings ?? undefined,
          is_active: config.is_active ?? true,
        },
      });
    }

    return webhook;
  });
}
