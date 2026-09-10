import { describe, expect, it, vi } from 'vitest';

import {
  applyFieldMappings,
  processWebhookBodyTemplate,
  replaceTemplateVariables,
  validateJsonTemplate,
} from './webhook-body-template';

describe('webhook body template utilities', () => {
  it('replaces flat and nested template variables', () => {
    expect(replaceTemplateVariables(
      '{"event":"{{event}}","name":"{{applicant.name}}","missing":"{{missing}}"}',
      { event: 'created', applicant: { name: 'Ada' } }
    )).toBe('{"event":"created","name":"Ada","missing":"{{missing}}"}');
  });

  it('applies field mappings with defaults and transforms', () => {
    expect(applyFieldMappings({
      applicant: {
        name: ' ada ',
        score: '82.5',
      },
    }, [
      { source_field: 'applicant.name', target_field: 'candidate.name', transform: 'trim' },
      { source_field: 'applicant.score', target_field: 'candidate.score', transform: 'number' },
      { source_field: 'applicant.missing', target_field: 'candidate.active', default_value: 'true', transform: 'boolean' },
    ])).toEqual({
      candidate: {
        name: 'ada',
        score: 82.5,
        active: true,
      },
    });
  });

  it('processes templates with a consistent timestamp and metadata', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-01T12:00:00.000Z'));

    const result = processWebhookBodyTemplate(
      '{"event":"{{event}}","webhook":"{{webhook_name}}","candidate":"{{candidate.name}}","timestamp":"{{timestamp}}"}',
      'applicant.created',
      { applicant: { name: 'Ada' } },
      { id: 'webhook-1', name: 'Applicant Hook', include_metadata: true },
      [{ source_field: 'applicant.name', target_field: 'candidate.name', transform: 'uppercase' }]
    );

    expect(result).toEqual({
      event: 'applicant.created',
      timestamp: '2026-06-01T12:00:00.000Z',
      webhook_id: 'webhook-1',
      data: {
        event: 'applicant.created',
        webhook: 'Applicant Hook',
        candidate: 'ADA',
        timestamp: '2026-06-01T12:00:00.000Z',
      },
      metadata: {
        webhook_name: 'Applicant Hook',
        event_type: 'applicant.created',
        processed_at: '2026-06-01T12:00:00.000Z',
        template_used: true,
      },
    });

    vi.useRealTimers();
  });

  it('validates JSON templates', () => {
    expect(validateJsonTemplate('{"ok": true}')).toEqual({ isValid: true });
    expect(validateJsonTemplate('{bad')).toMatchObject({ isValid: false });
  });
});
