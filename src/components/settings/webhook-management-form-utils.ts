import type { Webhook, WebhookFormData } from './webhook-management-data';

export interface WebhookEventCategoryLike {
  events: Array<{ id: string; label?: string; description?: string }>;
}

export interface CustomHeaderRow {
  key: string;
  value: string;
}

export function createDefaultWebhookFormData(): WebhookFormData {
  return {
    name: '',
    url: '',
    events: [],
    method: 'POST',
    is_active: true,
    auth_type: 'none',
    headers: {},
    retry_count: 3,
    timeout: 30,
  };
}

export function createWebhookFormDataFromWebhook(webhook: Webhook): WebhookFormData {
  return {
    name: webhook.name,
    url: webhook.url,
    events: webhook.events,
    method: webhook.method,
    is_active: webhook.is_active,
    auth_type: webhook.auth_type,
    auth_username: webhook.auth_username,
    auth_password: webhook.auth_password,
    auth_token: webhook.auth_token,
    auth_header_name: webhook.auth_header_name,
    auth_header_value: webhook.auth_header_value,
    headers: webhook.headers,
    retry_count: webhook.retry_count,
    timeout: webhook.timeout,
  };
}

export function customHeaderRowsToRecord(
  baseHeaders: Record<string, string>,
  customHeaders: CustomHeaderRow[]
) {
  const headers = { ...baseHeaders };

  for (const header of customHeaders) {
    if (header.key && header.value) {
      headers[header.key] = header.value;
    }
  }

  return headers;
}

export function headerRecordToRows(headers: Record<string, string>) {
  return Object.entries(headers).map(([key, value]) => ({ key, value }));
}

export function addCustomHeaderRow(rows: CustomHeaderRow[]) {
  return [...rows, { key: '', value: '' }];
}

export function removeCustomHeaderRow(rows: CustomHeaderRow[], indexToRemove: number) {
  return rows.filter((_, index) => index !== indexToRemove);
}

export function updateCustomHeaderRow(
  rows: CustomHeaderRow[],
  indexToUpdate: number,
  field: keyof CustomHeaderRow,
  value: string
) {
  return rows.map((header, index) => (
    index === indexToUpdate ? { ...header, [field]: value } : header
  ));
}

export function toggleWebhookEvent(events: string[], event: string) {
  return events.includes(event)
    ? events.filter(existingEvent => existingEvent !== event)
    : [...events, event];
}

export function getAllWebhookEventIds(categories: WebhookEventCategoryLike[]) {
  return categories.flatMap(category => category.events.map(event => event.id));
}

export function findWebhookEventById<T extends WebhookEventCategoryLike>(categories: T[], eventId: string) {
  for (const category of categories) {
    const event = category.events.find(categoryEvent => categoryEvent.id === eventId);
    if (event) return event;
  }

  return undefined;
}

export function addWebhookCategoryEvents(events: string[], categoryEvents: Array<{ id: string }>) {
  return Array.from(new Set([...events, ...categoryEvents.map(event => event.id)]));
}

export function removeWebhookCategoryEvents(events: string[], categoryEvents: Array<{ id: string }>) {
  const categoryEventIds = new Set(categoryEvents.map(event => event.id));
  return events.filter(eventId => !categoryEventIds.has(eventId));
}

export function countSelectedWebhookCategoryEvents(events: string[], categoryEvents: Array<{ id: string }>) {
  const selectedEvents = new Set(events);
  return categoryEvents.filter(event => selectedEvents.has(event.id)).length;
}

export function buildWebhookSubmitPayload(formData: WebhookFormData, customHeaders: CustomHeaderRow[]) {
  return {
    ...formData,
    headers: customHeaderRowsToRecord(formData.headers, customHeaders),
  };
}
