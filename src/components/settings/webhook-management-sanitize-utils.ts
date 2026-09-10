import type { Webhook } from './webhook-management-data';
import type { FieldMapping, WebhookBodyConfig } from './webhook-body-customization-types';

const WEBHOOK_METHODS = new Set<Webhook['method']>(['GET', 'POST', 'PUT', 'PATCH']);
const WEBHOOK_AUTH_TYPES = new Set<Webhook['auth_type']>(['none', 'basic', 'bearer', 'header']);
type FieldMappingTransform = NonNullable<FieldMapping['transform']>;

const FIELD_MAPPING_TRANSFORMS = new Set<FieldMappingTransform>([
  'uppercase',
  'lowercase',
  'trim',
  'date',
  'number',
  'boolean',
]);
type NullableSanitizer<T> = (value: unknown) => T | null;

export function sanitizeWebhook(rawWebhook: unknown): Webhook {
  const webhook = isRecord(rawWebhook) ? rawWebhook : {};

  return {
    id: getString(webhook.id),
    name: getString(webhook.name),
    url: getString(webhook.url),
    events: getStringArray(webhook.events),
    method: getWebhookMethod(webhook.method),
    is_active: Boolean(webhook.is_active),
    auth_type: getWebhookAuthType(webhook.auth_type),
    auth_username: getOptionalString(webhook.auth_username),
    auth_password: getOptionalString(webhook.auth_password),
    auth_token: getOptionalString(webhook.auth_token),
    auth_header_name: getOptionalString(webhook.auth_header_name),
    auth_header_value: getOptionalString(webhook.auth_header_value),
    headers: getStringRecord(webhook.headers),
    retry_count: getNumber(webhook.retry_count, 3),
    timeout: getNumber(webhook.timeout, 30),
    body_template: getNullableString(webhook.body_template),
    field_mappings: sanitizeFieldMappings(webhook.field_mappings),
    include_metadata: Boolean(webhook.include_metadata),
    custom_payload: Boolean(webhook.custom_payload),
    body_configs: sanitizeWebhookBodyConfigs(webhook.body_configs),
    createdAt: getString(webhook.createdAt, new Date().toISOString()),
    updatedAt: getString(webhook.updatedAt, new Date().toISOString()),
  };
}

export function sanitizeWebhookList(data: unknown) {
  return Array.isArray(data) ? data.map(sanitizeWebhook) : [];
}

function sanitizeFieldMapping(value: unknown): FieldMapping | null {
  if (!isRecord(value)) {
    return null;
  }

  const sourceField = getString(value.source_field);
  const targetField = getString(value.target_field);
  if (!sourceField || !targetField) {
    return null;
  }

  const transform = getFieldMappingTransform(value.transform);

  return {
    source_field: sourceField,
    target_field: targetField,
    ...(transform && { transform }),
    ...(value.default_value !== undefined && { default_value: value.default_value }),
  };
}

function sanitizeFieldMappings(value: unknown) {
  const mappings = sanitizeNullableList(value, sanitizeFieldMapping);

  return mappings.length > 0 ? mappings : null;
}

function sanitizeWebhookBodyConfig(value: unknown): WebhookBodyConfig | null {
  if (!isRecord(value)) {
    return null;
  }

  return {
    id: getOptionalString(value.id),
    event_type: getString(value.event_type),
    body_template: getString(value.body_template),
    field_mappings: sanitizeFieldMappings(value.field_mappings) ?? [],
    is_active: Boolean(value.is_active),
    created_at: getOptionalString(value.created_at),
    updated_at: getOptionalString(value.updated_at),
  };
}

function sanitizeWebhookBodyConfigs(value: unknown) {
  return sanitizeNullableList(value, sanitizeWebhookBodyConfig);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function getString(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback;
}

function getOptionalString(value: unknown) {
  return typeof value === 'string' ? value : undefined;
}

function getNullableString(value: unknown) {
  return typeof value === 'string' ? value : null;
}

function getNumber(value: unknown, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function getStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];
}

function getStringRecord(value: unknown): Record<string, string> {
  if (!isRecord(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value)
      .filter((entry): entry is [string, string] => typeof entry[1] === 'string')
  );
}

function getWebhookMethod(value: unknown): Webhook['method'] {
  return getAllowedSetValue(value, WEBHOOK_METHODS, 'POST');
}

function getWebhookAuthType(value: unknown): Webhook['auth_type'] {
  return getAllowedSetValue(value, WEBHOOK_AUTH_TYPES, 'none');
}

function getFieldMappingTransform(value: unknown) {
  return getAllowedSetValue(value, FIELD_MAPPING_TRANSFORMS, undefined);
}

function sanitizeNullableList<T>(value: unknown, sanitizeItem: NullableSanitizer<T>) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map(sanitizeItem)
    .filter((item): item is T => item !== null);
}

function getAllowedSetValue<T extends string>(
  value: unknown,
  allowedValues: Set<T>,
  fallback: T,
): T;
function getAllowedSetValue<T extends string>(
  value: unknown,
  allowedValues: Set<T>,
  fallback: undefined,
): T | undefined;
function getAllowedSetValue<T extends string>(
  value: unknown,
  allowedValues: Set<T>,
  fallback: T | undefined,
) {
  return typeof value === 'string' && allowedValues.has(value as T)
    ? value as T
    : fallback;
}
