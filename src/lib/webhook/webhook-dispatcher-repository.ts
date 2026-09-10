import prisma from '../prisma';
import { webhookRateLimits } from '../webhookRateLimit';
import type { Prisma } from '@prisma/client';
import type { WebhookResult } from './webhook-dispatcher-types';

export async function checkDispatcherRateLimits(): Promise<WebhookResult | null> {
  const globalLimit = await webhookRateLimits.global.checkLimit('global');
  if (!globalLimit.allowed) {
    return {
      webhook_id: 'global',
      success: false,
      error: 'Rate limit exceeded',
      duration_ms: 0,
      rateLimited: true,
    };
  }

  const burstLimit = await webhookRateLimits.burst.checkLimit('burst');
  if (!burstLimit.allowed) {
    return {
      webhook_id: 'burst',
      success: false,
      error: 'Burst protection triggered',
      duration_ms: 0,
      rateLimited: true,
    };
  }

  return null;
}

export function findActiveEventWebhooks(event: string) {
  return prisma.webhook.findMany({
    where: {
      is_active: true,
      events: {
        has: event,
      },
    },
  });
}

function toPrismaJson(value: unknown): Prisma.InputJsonValue {
  const serialized = JSON.stringify(value ?? null);
  return JSON.parse(serialized) as Prisma.InputJsonValue;
}

export async function logWebhookAttempt(
  webhookId: string,
  eventType: string,
  payload: unknown,
  responseStatus: number | null,
  responseBody: string | null,
  success: boolean,
  errorMessage: string | null,
  durationMs: number
) {
  try {
    await prisma.webhookLog.create({
      data: {
        webhook_id: webhookId,
        event_type: eventType,
        payload: toPrismaJson(payload),
        response_status: responseStatus,
        response_body: responseBody,
        success,
        error_message: errorMessage,
        duration_ms: durationMs,
      },
    });
  } catch (error) {
    console.error('Failed to log webhook attempt:', error);
  }
}
