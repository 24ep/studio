import type {
  FieldMapping,
  WebhookBodyConfig,
  WebhookBodyCustomizationInitialConfig,
} from './webhook-body-customization-types';

const FALLBACK_EVENT_BODY_TEMPLATE = '{\n  "event": "{{event}}",\n  "data": {{data}},\n  "timestamp": "{{timestamp}}"\n}';

export function indexWebhookBodyConfigs(
  configs?: WebhookBodyCustomizationInitialConfig['body_configs']
) {
  return configs?.reduce((indexedConfigs, config) => {
    indexedConfigs[config.event_type] = config;
    return indexedConfigs;
  }, {} as Record<string, WebhookBodyConfig>) ?? {};
}

export function buildWebhookBodySavePayload({
  customPayload,
  includeMetadata,
  globalBodyTemplate,
  globalFieldMappings,
  bodyConfigs,
}: {
  customPayload: boolean;
  includeMetadata: boolean;
  globalBodyTemplate: string;
  globalFieldMappings: FieldMapping[];
  bodyConfigs: Record<string, WebhookBodyConfig>;
}) {
  return {
    custom_payload: customPayload,
    include_metadata: includeMetadata,
    body_template: globalBodyTemplate,
    field_mappings: globalFieldMappings,
    body_configs: Object.values(bodyConfigs),
  };
}

export function createWebhookEventBodyConfig(
  eventType: string,
  globalBodyTemplate: string,
  globalFieldMappings: FieldMapping[]
): WebhookBodyConfig {
  return {
    event_type: eventType,
    body_template: globalBodyTemplate || FALLBACK_EVENT_BODY_TEMPLATE,
    field_mappings: [...globalFieldMappings],
    is_active: true,
  };
}

export function updateFieldMapping(
  mappings: FieldMapping[] | undefined,
  index: number,
  field: keyof FieldMapping,
  value: unknown
) {
  return (mappings || []).map((mapping, mappingIndex) =>
    mappingIndex === index ? { ...mapping, [field]: value } : mapping
  );
}

export function removeFieldMapping(mappings: FieldMapping[] | undefined, index: number) {
  return (mappings || []).filter((_, mappingIndex) => mappingIndex !== index);
}

export function appendEmptyFieldMapping(mappings: FieldMapping[] | undefined) {
  return [...(mappings || []), { source_field: '', target_field: '' }];
}

export function resolveWebhookPreviewConfig({
  selectedEvent,
  bodyConfigs,
  globalBodyTemplate,
  globalFieldMappings,
}: {
  selectedEvent: string;
  bodyConfigs: Record<string, WebhookBodyConfig>;
  globalBodyTemplate: string;
  globalFieldMappings: FieldMapping[];
}) {
  return bodyConfigs[selectedEvent] || {
    event_type: selectedEvent,
    body_template: globalBodyTemplate,
    field_mappings: globalFieldMappings,
  };
}
