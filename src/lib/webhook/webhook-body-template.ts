import type { FieldMapping, ProcessedWebhookPayload } from './webhook-body-types';
import type { WebhookData } from './webhook-dispatcher-types';

const STRING_TRANSFORMS: Record<string, (value: string) => string> = {
  uppercase: (value) => value.toUpperCase(),
  lowercase: (value) => value.toLowerCase(),
  trim: (value) => value.trim(),
};

export function processWebhookBodyTemplate(
  template: string,
  event: string,
  data: WebhookData,
  webhook: WebhookData,
  fieldMappings?: FieldMapping[]
): ProcessedWebhookPayload {
  try {
    const timestamp = new Date().toISOString();
    const webhookId = getWebhookString(webhook.id);
    const webhookName = getWebhookString(webhook.name);
    const baseContext = buildTemplateContext({ event, timestamp, webhookId, webhookName, data });

    let processedTemplate = replaceTemplateVariables(template, baseContext);

    if (fieldMappings && fieldMappings.length > 0) {
      const mappedData = applyFieldMappings(data, fieldMappings);
      processedTemplate = replaceTemplateVariables(
        processedTemplate,
        buildTemplateContext({ event, timestamp, webhookId, webhookName, data: mappedData })
      );
    }

    return {
      event,
      timestamp,
      data: JSON.parse(processedTemplate),
      webhook_id: webhookId,
      metadata: webhook.include_metadata ? {
        webhook_name: webhookName,
        event_type: event,
        processed_at: timestamp,
        template_used: true,
      } : undefined,
    };
  } catch (error) {
    console.error('Error processing template:', error);
    throw new Error(`Template processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export function replaceTemplateVariables(template: string, variables: WebhookData): string {
  return template.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
    const value = getNestedValue(variables, path);
    return value !== undefined ? stringifyTemplateValue(value) : match;
  });
}

export function applyFieldMappings(data: WebhookData, mappings: FieldMapping[]): WebhookData {
  const result: WebhookData = {};

  mappings.forEach(mapping => {
    let value = getNestedValue(data, mapping.source_field);

    if (value === undefined && mapping.default_value !== undefined) {
      value = mapping.default_value;
    }

    if (value !== undefined && mapping.transform) {
      value = applyTransformation(value, mapping.transform);
    }

    if (value !== undefined) {
      setNestedValue(result, mapping.target_field, value);
    }
  });

  return result;
}

export function validateJsonTemplate(template: string): { isValid: boolean; error?: string } {
  try {
    JSON.parse(template);
    return { isValid: true };
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Invalid JSON template',
    };
  }
}

function getNestedValue(obj: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((current, key) => {
    if (!current || typeof current !== 'object') {
      return undefined;
    }

    const currentRecord = current as WebhookData;
    return currentRecord[key] !== undefined ? currentRecord[key] : undefined;
  }, obj);
}

function setNestedValue(obj: WebhookData, path: string, value: unknown): void {
  const keys = path.split('.');
  const lastKey = keys.pop();
  if (!lastKey) return;

  let current: WebhookData = obj;
  for (const key of keys) {
    if (!isWritableWebhookData(current[key])) {
      current[key] = {};
    }
    current = current[key] as WebhookData;
  }

  current[lastKey] = value;
}

function applyTransformation(value: unknown, transform: string): unknown {
  const stringTransform = STRING_TRANSFORMS[transform];
  if (stringTransform) {
    return typeof value === 'string' ? stringTransform(value) : value;
  }

  if (transform === 'date') return value instanceof Date ? value.toISOString() : value;
  if (transform === 'number') return toTemplateNumber(value);
  if (transform === 'boolean') return toTemplateBoolean(value);

  return value;
}

function stringifyTemplateValue(value: unknown) {
  return typeof value === 'object' ? JSON.stringify(value) : String(value);
}

function buildTemplateContext({
  event,
  timestamp,
  webhookId,
  webhookName,
  data,
}: {
  event: string;
  timestamp: string;
  webhookId: string;
  webhookName: string;
  data: WebhookData;
}): WebhookData {
  return {
    event,
    timestamp,
    webhook_id: webhookId,
    webhook_name: webhookName,
    ...data,
  };
}

function getWebhookString(value: unknown) {
  return typeof value === 'string' ? value : String(value || '');
}

function isWritableWebhookData(value: unknown): value is WebhookData {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function toTemplateNumber(value: unknown) {
  return typeof value === 'string' ? parseFloat(value) || 0 : Number(value) || 0;
}

function toTemplateBoolean(value: unknown) {
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true' || value === '1';
  }

  return Boolean(value);
}
