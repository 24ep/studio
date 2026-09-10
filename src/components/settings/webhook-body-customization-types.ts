export interface FieldMapping {
  source_field: string;
  target_field: string;
  transform?: 'uppercase' | 'lowercase' | 'trim' | 'date' | 'number' | 'boolean';
  default_value?: unknown;
}

export interface WebhookBodyConfig {
  id?: string;
  event_type: string;
  body_template: string;
  field_mappings?: FieldMapping[];
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface WebhookBodyCustomizationInitialConfig {
  body_template?: string;
  field_mappings?: FieldMapping[];
  include_metadata?: boolean;
  custom_payload?: boolean;
  body_configs?: WebhookBodyConfig[];
}

export interface WebhookBodyCustomizationProps {
  webhookId: string;
  webhookEvents: string[];
  initialConfig?: WebhookBodyCustomizationInitialConfig;
  onSave: (config: unknown) => Promise<void>;
  onClose?: () => void;
}

export const TRANSFORM_OPTIONS = [
  { value: 'uppercase', label: 'Uppercase', description: 'Convert to uppercase' },
  { value: 'lowercase', label: 'Lowercase', description: 'Convert to lowercase' },
  { value: 'trim', label: 'Trim', description: 'Remove whitespace' },
  { value: 'date', label: 'Date', description: 'Format as date' },
  { value: 'number', label: 'Number', description: 'Convert to number' },
  { value: 'boolean', label: 'Boolean', description: 'Convert to boolean' },
] as const;

export function getDefaultWebhookBodyTemplate(eventType: string) {
  return `{
  "event": "${eventType}",
  "timestamp": "{{timestamp}}",
  "data": {{data}},
  "webhook_id": "{{webhook_id}}"
}`;
}
