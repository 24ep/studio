import { z } from 'zod';
import type { Prisma } from '@prisma/client';

const jsonValueSchema = z.custom<Prisma.InputJsonValue>();

export type WebhookBodyConfigRouteContext = {
  params: Promise<{ id: string }>;
};

export const fieldMappingSchema = z.object({
  source_field: z.string(),
  target_field: z.string(),
  transform: z.enum(['uppercase', 'lowercase', 'trim', 'date', 'number', 'boolean']).optional(),
  default_value: jsonValueSchema.optional(),
});

export const bodyConfigSchema = z.object({
  event_type: z.string(),
  body_template: z.string(),
  field_mappings: z.array(fieldMappingSchema).optional(),
  is_active: z.boolean().optional(),
});

export const bodyConfigUpdateSchema = z.object({
  body_template: z.string().optional(),
  field_mappings: z.array(fieldMappingSchema).optional(),
  include_metadata: z.boolean().optional(),
  custom_payload: z.boolean().optional(),
  body_configs: z.array(bodyConfigSchema).optional(),
});

export type BodyConfigInput = z.infer<typeof bodyConfigSchema>;
export type BodyConfigUpdateInput = z.infer<typeof bodyConfigUpdateSchema>;

export async function resolveWebhookBodyConfigParams(context: WebhookBodyConfigRouteContext) {
  const { id } = await context.params;
  return { webhookId: id };
}
