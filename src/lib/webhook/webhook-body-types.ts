import type { WebhookData } from './webhook-dispatcher-types';

export interface FieldMapping {
  source_field: string;
  target_field: string;
  transform?: 'uppercase' | 'lowercase' | 'trim' | 'date' | 'number' | 'boolean';
  default_value?: unknown;
}

export interface WebhookBodyConfig {
  event_type: string;
  body_template: string;
  field_mappings?: FieldMapping[];
  is_active: boolean;
}

export interface ProcessedWebhookPayload {
  event: string;
  timestamp: string;
  data: unknown;
  webhook_id?: string;
  metadata?: WebhookData;
}
