import type { Prisma, Webhook } from '@prisma/client';

import prisma from '../prisma';
import { WebhookBodyProcessor } from '../webhookBodyProcessor';
import type { ProcessedWebhookPayload } from './webhook-body-types';
import type { WebhookData } from './webhook-dispatcher-types';

export interface WebhookDeliveryResult {
  success: boolean;
  status?: number;
  response?: string;
  error?: string;
  duration_ms: number;
}

const RETRY_DELAYS_MS = [1000, 5000, 5000, 5000, 5000];

export async function sendServiceWebhook(
  webhook: Webhook,
  event: string,
  data: WebhookData
): Promise<WebhookDeliveryResult> {
  const attempt = await sendServiceWebhookAttempt(webhook, event, data);

  if (!attempt.result.success && webhook.retry_count > 0) {
    await retryServiceWebhook(webhook, event, data, webhook.retry_count);
  }

  return attempt.result;
}

async function sendServiceWebhookAttempt(
  webhook: Webhook,
  event: string,
  data: WebhookData
) {
  const startTime = Date.now();
  let processedPayload = createInitialWebhookPayload(event, data, webhook.id);
  let result: WebhookDeliveryResult;

  try {
    processedPayload = await WebhookBodyProcessor.processWebhookPayload(webhook.id, event, data);
    const headers = createWebhookHeaders(webhook, event, processedPayload);
    await validateServiceWebhookUrl(webhook.url);
    result = await deliverWebhookRequest(webhook, processedPayload, headers, startTime);
  } catch (error) {
    result = {
      success: false,
      error: getErrorMessage(error),
      duration_ms: Date.now() - startTime,
    };
  }

  await logWebhookDelivery(webhook.id, processedPayload, result);
  return { processedPayload, result };
}

async function retryServiceWebhook(
  webhook: Webhook,
  event: string,
  data: WebhookData,
  retryCount: number
) {
  for (let attempt = 0; attempt < Math.min(retryCount, RETRY_DELAYS_MS.length); attempt++) {
    await wait(RETRY_DELAYS_MS[attempt]);

    const { result } = await sendServiceWebhookAttempt(webhook, event, data);
    if (result.success) {
      break;
    }
  }
}

async function deliverWebhookRequest(
  webhook: Webhook,
  processedPayload: ProcessedWebhookPayload,
  headers: Record<string, string>,
  startTime: number
): Promise<WebhookDeliveryResult> {
  const timeout = webhook.timeout ? webhook.timeout * 1000 : 30000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(webhook.url, {
      method: webhook.method,
      headers,
      body: webhook.method !== 'GET' ? JSON.stringify(processedPayload) : undefined,
      signal: controller.signal,
    });
    const responseBody = await response.text().catch(() => 'Unable to read response body');
    const result: WebhookDeliveryResult = {
      success: response.ok,
      status: response.status,
      response: responseBody,
      duration_ms: Date.now() - startTime,
    };

    if (!response.ok) {
      result.error = `HTTP ${response.status}`;
    }

    return result;
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    const isTimeout = error instanceof Error && (error.name === 'AbortError' || errorMessage.includes('timeout'));

    return {
      success: false,
      error: isTimeout ? `Request timeout after ${timeout}ms` : errorMessage,
      duration_ms: Date.now() - startTime,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

function createInitialWebhookPayload(event: string, data: WebhookData, webhookId: string): ProcessedWebhookPayload {
  return {
    event,
    timestamp: new Date().toISOString(),
    data,
    webhook_id: webhookId,
  };
}

function createWebhookHeaders(webhook: Webhook, event: string, processedPayload: ProcessedWebhookPayload) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'User-Agent': 'Recruitment-System-Webhook/1.0',
    'X-Webhook-ID': webhook.id,
    'X-Event-Type': event,
    'X-Timestamp': processedPayload.timestamp,
  };

  if (webhook.headers && typeof webhook.headers === 'object' && !Array.isArray(webhook.headers)) {
    Object.entries(webhook.headers).forEach(([key, value]) => {
      headers[key] = typeof value === 'string' ? value : String(value);
    });
  }

  addAuthHeaders(headers, webhook);
  return headers;
}

function addAuthHeaders(headers: Record<string, string>, webhook: Webhook) {
  if (webhook.auth_type === 'basic' && webhook.auth_username && webhook.auth_password) {
    const credentials = Buffer.from(`${webhook.auth_username}:${webhook.auth_password}`).toString('base64');
    headers.Authorization = `Basic ${credentials}`;
    return;
  }

  if (webhook.auth_type === 'bearer' && webhook.auth_token) {
    headers.Authorization = `Bearer ${webhook.auth_token}`;
    return;
  }

  if (webhook.auth_type === 'header' && webhook.auth_header_name && webhook.auth_header_value) {
    headers[webhook.auth_header_name] = webhook.auth_header_value;
  }
}

async function validateServiceWebhookUrl(url: string) {
  const { validateWebhookUrl } = await import('@/lib/webhookSecurity');
  const urlValidation = validateWebhookUrl(url);

  if (!urlValidation.valid) {
    throw new Error(`Invalid webhook URL: ${urlValidation.error}`);
  }
}

async function logWebhookDelivery(
  webhookId: string,
  payload: ProcessedWebhookPayload,
  result: WebhookDeliveryResult
) {
  try {
    await prisma.webhookLog.create({
      data: {
        webhook_id: webhookId,
        event_type: payload.event,
        payload: payload as unknown as Prisma.InputJsonValue,
        response_status: result.status || null,
        response_body: result.response || null,
        success: result.success,
        error_message: result.error || null,
        duration_ms: result.duration_ms,
      },
    });
  } catch (error) {
    console.error('Error logging webhook delivery:', error);
  }
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Unknown error';
}

function wait(delayMs: number) {
  return new Promise(resolve => setTimeout(resolve, delayMs));
}
