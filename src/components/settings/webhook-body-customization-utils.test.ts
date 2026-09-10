import { describe, expect, it } from 'vitest';

import {
  appendEmptyFieldMapping,
  buildWebhookBodySavePayload,
  createWebhookEventBodyConfig,
  indexWebhookBodyConfigs,
  removeFieldMapping,
  resolveWebhookPreviewConfig,
  updateFieldMapping,
} from './webhook-body-customization-utils';

describe('webhook-body-customization-utils', () => {
  it('indexes configs and builds save payloads', () => {
    const bodyConfigs = indexWebhookBodyConfigs([
      {
        event_type: 'applicant.created',
        body_template: '{"id":"{{id}}"}',
        field_mappings: [{ source_field: 'id', target_field: 'applicantId' }],
        is_active: true,
      },
    ]);

    expect(bodyConfigs['applicant.created']).toMatchObject({
      body_template: '{"id":"{{id}}"}',
      is_active: true,
    });
    expect(buildWebhookBodySavePayload({
      customPayload: true,
      includeMetadata: false,
      globalBodyTemplate: '{}',
      globalFieldMappings: [],
      bodyConfigs,
    })).toMatchObject({
      custom_payload: true,
      include_metadata: false,
      body_template: '{}',
      body_configs: [bodyConfigs['applicant.created']],
    });
  });

  it('creates event configs and resolves preview config fallbacks', () => {
    const globalMappings = [{ source_field: 'name', target_field: 'candidateName' }];
    const eventConfig = createWebhookEventBodyConfig('applicant.updated', '', globalMappings);

    expect(eventConfig).toMatchObject({
      event_type: 'applicant.updated',
      is_active: true,
      field_mappings: globalMappings,
    });
    expect(eventConfig.field_mappings).not.toBe(globalMappings);
    expect(resolveWebhookPreviewConfig({
      selectedEvent: 'applicant.updated',
      bodyConfigs: { 'applicant.updated': eventConfig },
      globalBodyTemplate: '{}',
      globalFieldMappings: [],
    })).toBe(eventConfig);
    expect(resolveWebhookPreviewConfig({
      selectedEvent: 'missing',
      bodyConfigs: {},
      globalBodyTemplate: '{}',
      globalFieldMappings: globalMappings,
    })).toEqual({
      event_type: 'missing',
      body_template: '{}',
      field_mappings: globalMappings,
    });
  });

  it('updates, appends, and removes field mappings immutably', () => {
    const mappings = [
      { source_field: 'name', target_field: 'candidateName' },
      { source_field: 'email', target_field: 'candidateEmail' },
    ];

    expect(updateFieldMapping(mappings, 1, 'target_field', 'emailAddress')).toEqual([
      mappings[0],
      { source_field: 'email', target_field: 'emailAddress' },
    ]);
    expect(removeFieldMapping(mappings, 0)).toEqual([mappings[1]]);
    expect(appendEmptyFieldMapping(mappings)).toEqual([
      ...mappings,
      { source_field: '', target_field: '' },
    ]);
  });
});
