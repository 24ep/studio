export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { type NextRequest } from 'next/server';
import {
  handleCreateWebhookBodyConfig,
  handleGetWebhookBodyConfig,
  handleUpdateWebhookBodyConfig,
} from './webhook-body-config-handlers';
import type { WebhookBodyConfigRouteContext } from './webhook-body-config-schema';

export function GET(request: NextRequest, context: WebhookBodyConfigRouteContext) {
  return handleGetWebhookBodyConfig(request, context);
}

export function POST(request: NextRequest, context: WebhookBodyConfigRouteContext) {
  return handleCreateWebhookBodyConfig(request, context);
}

export function PUT(request: NextRequest, context: WebhookBodyConfigRouteContext) {
  return handleUpdateWebhookBodyConfig(request, context);
}
