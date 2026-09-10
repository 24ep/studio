import { NextResponse } from 'next/server';
import { WebhookBodyProcessor } from '@/lib/webhookBodyProcessor';
import type { BodyConfigInput, BodyConfigUpdateInput } from './webhook-body-config-schema';

export function validateSingleBodyTemplate(bodyTemplate: string) {
  const templateValidation = WebhookBodyProcessor.validateTemplate(bodyTemplate);
  if (templateValidation.isValid) {
    return null;
  }

  return NextResponse.json(
    {
      error: 'Invalid body template',
      details: templateValidation.error,
    },
    { status: 400 },
  );
}

export function validateCreateBodyConfigTemplate(data: BodyConfigInput) {
  return validateSingleBodyTemplate(data.body_template);
}

export function validateUpdateBodyConfigTemplates(data: BodyConfigUpdateInput) {
  if (data.body_template) {
    const templateError = validateSingleBodyTemplate(data.body_template);
    if (templateError) {
      return templateError;
    }
  }

  for (const config of data.body_configs ?? []) {
    if (!config.body_template) {
      continue;
    }

    const templateValidation = WebhookBodyProcessor.validateTemplate(config.body_template);
    if (!templateValidation.isValid) {
      return NextResponse.json(
        {
          error: `Invalid body template for event ${config.event_type}`,
          details: templateValidation.error,
        },
        { status: 400 },
      );
    }
  }

  return null;
}
