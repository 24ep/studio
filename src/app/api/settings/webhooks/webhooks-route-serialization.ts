import type { Prisma } from "@prisma/client";

type WebhookWithBodyConfigs = Prisma.WebhookGetPayload<{
  include: {
    body_configs: true;
  };
}>;

export function serializeWebhookWithBodyConfigs(webhook: WebhookWithBodyConfigs) {
  return {
    id: webhook.id || "",
    name: webhook.name || "",
    url: webhook.url || "",
    events: Array.isArray(webhook.events) ? webhook.events : [],
    method: webhook.method || "POST",
    is_active: Boolean(webhook.is_active),
    auth_type: webhook.auth_type || "none",
    auth_username: webhook.auth_username || null,
    auth_password: webhook.auth_password || null,
    auth_token: webhook.auth_token || null,
    auth_header_name: webhook.auth_header_name || null,
    auth_header_value: webhook.auth_header_value || null,
    headers: webhook.headers || {},
    retry_count: webhook.retry_count || 3,
    timeout: webhook.timeout || 30,
    body_template: webhook.body_template || null,
    field_mappings: webhook.field_mappings || null,
    include_metadata: Boolean(webhook.include_metadata),
    custom_payload: Boolean(webhook.custom_payload),
    body_configs: webhook.body_configs.map((config) => ({
      id: config.id,
      event_type: config.event_type,
      body_template: config.body_template,
      field_mappings: config.field_mappings,
      is_active: config.is_active,
      created_at: config.created_at,
      updated_at: config.updated_at,
    })),
    createdAt: webhook.createdAt?.toISOString() || new Date().toISOString(),
    updatedAt: webhook.updatedAt?.toISOString() || new Date().toISOString(),
  };
}
