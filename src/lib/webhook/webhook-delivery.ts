import { webhookFetch } from '../webhookFetch';
import { webhookRateLimits } from '../webhookRateLimit';
import { logWebhookAttempt } from './webhook-dispatcher-repository';
import type { WebhookPayload, WebhookResult } from './webhook-dispatcher-types';

const WEBHOOK_USER_AGENT = 'Recruitment-System-Webhook/1.0';
const BASE_RETRY_DELAY_MS = 2000;
const MAX_RETRY_DELAY_MS = 10000;

type WebhookDeliveryConfig = {
  id: string;
  url: string;
  method: string;
  retry_count?: number | string | null;
  headers?: unknown;
  auth_type?: string | null;
  auth_username?: string | null;
  auth_password?: string | null;
  auth_token?: string | null;
  auth_header_name?: string | null;
  auth_header_value?: string | null;
};

export async function sendWebhookDelivery(
  webhook: WebhookDeliveryConfig,
  event: string,
  data: unknown
): Promise<WebhookResult> {
  const startTime = Date.now();

  const webhookLimit = await webhookRateLimits.perWebhook.checkLimit(webhook.id);
  if (!webhookLimit.allowed) {
    return {
      webhook_id: webhook.id,
      success: false,
      error: 'Rate limit exceeded',
      duration_ms: 0,
      rateLimited: true,
    };
  }

  const urlError = await getWebhookUrlError(webhook.url);
  if (urlError) {
    return {
      webhook_id: webhook.id,
      success: false,
      error: urlError,
      duration_ms: 0,
      rateLimited: false,
    };
  }

  const payload = createWebhookPayload(event, data, webhook.id);
  const headers = createWebhookHeaders(webhook, event);
  const retryCount = Number(webhook.retry_count) || 0;
  let lastError: string | null = null;
  let lastStatus: number | null = null;

  for (let attempt = 0; attempt <= retryCount; attempt++) {
    try {
      const webhookResult = await webhookFetch({
        url: webhook.url,
        method: webhook.method,
        headers,
        body: webhook.method !== 'GET' ? JSON.stringify(payload) : undefined,
        timeoutMs: 0,
        retries: 0,
      });

      lastStatus = webhookResult.status;

      if (webhookResult.ok) {
        const duration = Date.now() - startTime;
        await logWebhookAttempt(
          webhook.id,
          event,
          payload,
          webhookResult.status,
          webhookResult.body,
          true,
          null,
          duration
        );

        return {
          webhook_id: webhook.id,
          success: true,
          status: webhookResult.status,
          duration_ms: duration,
        };
      }

      lastError = `HTTP ${webhookResult.status}`;
      if (isClientError(webhookResult.status)) {
        break;
      }
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Unknown error';
      console.warn(`[Webhook] Attempt ${attempt + 1} failed for ${webhook.url}:`, lastError);

      if (attempt === retryCount) {
        break;
      }

      if (attempt > 0) {
        await wait(getRetryDelayMs(attempt));
      }
    }
  }

  const duration = Date.now() - startTime;
  await logWebhookAttempt(webhook.id, event, payload, lastStatus, null, false, lastError, duration);

  return {
    webhook_id: webhook.id,
    success: false,
    status: lastStatus || undefined,
    error: lastError || 'Max retries exceeded',
    duration_ms: duration,
  };
}

function createWebhookPayload(event: string, data: unknown, webhookId: string): WebhookPayload {
  return {
    event,
    timestamp: new Date().toISOString(),
    data,
    webhook_id: webhookId,
  };
}

function createWebhookHeaders(webhook: WebhookDeliveryConfig, event: string): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'User-Agent': WEBHOOK_USER_AGENT,
    'X-Webhook-ID': webhook.id,
    'X-Event-Type': event,
    'X-Timestamp': new Date().toISOString(),
  };

  if (webhook.headers && typeof webhook.headers === 'object' && !Array.isArray(webhook.headers)) {
    Object.entries(webhook.headers).forEach(([key, value]) => {
      headers[key] = typeof value === 'string' ? value : String(value);
    });
  }

  addAuthHeaders(headers, webhook);
  return headers;
}

function addAuthHeaders(headers: Record<string, string>, webhook: WebhookDeliveryConfig) {
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

async function getWebhookUrlError(url: string): Promise<string | null> {
  const { validateWebhookUrl } = await import('@/lib/webhookSecurity');
  const urlValidation = validateWebhookUrl(url);
  return urlValidation.valid ? null : `Invalid webhook URL: ${urlValidation.error}`;
}

function isClientError(status: number) {
  return status >= 400 && status < 500;
}

function getRetryDelayMs(attempt: number) {
  return Math.min(BASE_RETRY_DELAY_MS * Math.pow(2, attempt), MAX_RETRY_DELAY_MS);
}

function wait(delayMs: number) {
  return new Promise(resolve => setTimeout(resolve, delayMs));
}
