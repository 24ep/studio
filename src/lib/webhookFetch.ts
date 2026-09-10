/**
 * Webhook fetch utility with proper timeout handling and SSRF protection.
 */

import {
  buildLegacyWebhookRequestInit,
  runWebhookFetchAttempts,
} from './webhook-fetch-core';
import {
  WebhookFetchError,
  type WebhookFetchOptions,
  type WebhookFetchResult,
} from './webhook-fetch-types';
import { validateWebhookUrl } from './webhookSecurity';

export {
  WebhookFetchError,
  type WebhookFetchOptions,
  type WebhookFetchResult,
};

/**
 * Enhanced fetch function for webhooks with proper timeout handling.
 */
export async function webhookFetch(options: WebhookFetchOptions): Promise<WebhookFetchResult> {
  const {
    url,
    method = 'POST',
    headers = {},
    body,
    timeoutMs = 5000,
    retries = 0,
    retryDelayMs = 1000,
  } = options;

  const urlValidation = validateWebhookUrl(url);
  if (!urlValidation.valid) {
    throw new WebhookFetchError(
      `Invalid webhook URL: ${urlValidation.error}`,
      undefined,
      undefined,
      false
    );
  }

  return runWebhookFetchAttempts({
    body,
    headers,
    method,
    retries,
    retryDelayMs,
    startTime: Date.now(),
    timeoutMs,
    url,
  });
}

/**
 * Legacy fetch wrapper for backward compatibility.
 */
export async function legacyWebhookFetch(
  url: string,
  options: {
    method?: string;
    headers?: Record<string, string>;
    body?: string;
    signal?: AbortSignal;
  }
): Promise<Response> {
  return fetch(url, buildLegacyWebhookRequestInit(options));
}
