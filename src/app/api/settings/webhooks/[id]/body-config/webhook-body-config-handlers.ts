import { NextResponse, type NextRequest } from 'next/server';
import { requireWebhookBodyConfigSession } from './webhook-body-config-auth';
import {
  fetchWebhookBodyConfigPage,
  fetchWebhookEvents,
  updateWebhookBodyCustomization,
  upsertWebhookBodyConfig,
} from './webhook-body-config-data';
import { parseBodyConfigCreateBody, parseBodyConfigUpdateBody } from './webhook-body-config-request';
import { serializeWebhookBodyConfigPage } from './webhook-body-config-response';
import { resolveWebhookBodyConfigParams, type WebhookBodyConfigRouteContext } from './webhook-body-config-schema';
import {
  validateCreateBodyConfigTemplate,
  validateUpdateBodyConfigTemplates,
} from './webhook-body-config-validation';

export async function handleGetWebhookBodyConfig(_request: NextRequest, context: WebhookBodyConfigRouteContext) {
  try {
    const session = await requireWebhookBodyConfigSession();
    if (!session.ok) {
      return session.response;
    }

    const { webhookId } = await resolveWebhookBodyConfigParams(context);
    const { bodyConfigs, webhook } = await fetchWebhookBodyConfigPage(webhookId);

    if (!webhook) {
      return NextResponse.json({ error: 'Webhook not found' }, { status: 404 });
    }

    return NextResponse.json(serializeWebhookBodyConfigPage(webhook, bodyConfigs));
  } catch (error) {
    console.error('Error fetching webhook body configs:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function handleCreateWebhookBodyConfig(request: NextRequest, context: WebhookBodyConfigRouteContext) {
  try {
    const session = await requireWebhookBodyConfigSession();
    if (!session.ok) {
      return session.response;
    }

    const { webhookId } = await resolveWebhookBodyConfigParams(context);
    const parsedBody = await parseBodyConfigCreateBody(request);
    if (!parsedBody.ok) {
      return parsedBody.response;
    }

    const templateError = validateCreateBodyConfigTemplate(parsedBody.data);
    if (templateError) {
      return templateError;
    }

    const webhook = await fetchWebhookEvents(webhookId);
    if (!webhook) {
      return NextResponse.json({ error: 'Webhook not found' }, { status: 404 });
    }

    if (!webhook.events.includes(parsedBody.data.event_type)) {
      return NextResponse.json(
        { error: `Event type '${parsedBody.data.event_type}' is not configured for this webhook` },
        { status: 400 },
      );
    }

    const bodyConfig = await upsertWebhookBodyConfig(webhookId, parsedBody.data);
    return NextResponse.json(bodyConfig, { status: 201 });
  } catch (error) {
    console.error('Error creating webhook body config:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function handleUpdateWebhookBodyConfig(request: NextRequest, context: WebhookBodyConfigRouteContext) {
  try {
    const session = await requireWebhookBodyConfigSession();
    if (!session.ok) {
      return session.response;
    }

    const { webhookId } = await resolveWebhookBodyConfigParams(context);
    const parsedBody = await parseBodyConfigUpdateBody(request);
    if (!parsedBody.ok) {
      return parsedBody.response;
    }

    const templateError = validateUpdateBodyConfigTemplates(parsedBody.data);
    if (templateError) {
      return templateError;
    }

    const webhook = await updateWebhookBodyCustomization(webhookId, parsedBody.data);
    return NextResponse.json(webhook);
  } catch (error) {
    console.error('Error updating webhook body config:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
