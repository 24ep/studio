import type { FieldMapping } from './webhook-body-customization-types';
import { getJsonObject, readJsonObject, readJsonOrFallback } from '@/lib/response-json';

export type WebhookAvailableFieldsPayload = {
  fields: Record<string, string[]>;
  samples: Record<string, unknown>;
};

export async function fetchWebhookAvailableFields(): Promise<WebhookAvailableFieldsPayload> {
  const response = await fetch('/api/settings/webhooks/available-fields');
  if (!response.ok) {
    throw new Error('Failed to load available fields');
  }

  const data = await readJsonObject(response);
  return {
    fields: getJsonObject(data, 'fields') as Record<string, string[]> | undefined || {},
    samples: getJsonObject(data, 'samples') || {},
  };
}

export async function fetchWebhookBodyPreview({
  eventType,
  bodyTemplate,
  fieldMappings,
}: {
  eventType: string;
  bodyTemplate: string;
  fieldMappings?: FieldMapping[];
}) {
  const response = await fetch('/api/settings/webhooks/validate-template', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event_type: eventType,
      body_template: bodyTemplate,
      field_mappings: fieldMappings,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to generate preview');
  }

  return readJsonObject(response).then((data) => data.preview);
}
