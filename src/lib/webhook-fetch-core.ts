import {
  WebhookFetchError,
  type WebhookFetchOptions,
  type WebhookFetchResult,
} from './webhook-fetch-types';

type WebhookAttemptOptions = Required<
  Pick<WebhookFetchOptions, 'headers' | 'method' | 'timeoutMs' | 'url'>
> & Pick<WebhookFetchOptions, 'body'>;

export async function runWebhookFetchAttempts({
  body,
  headers,
  method,
  retries,
  retryDelayMs,
  startTime,
  timeoutMs,
  url,
}: WebhookAttemptOptions & {
  retries: number;
  retryDelayMs: number;
  startTime: number;
}): Promise<WebhookFetchResult> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await fetchWebhookAttempt({ body, headers, method, timeoutMs, url });
      const responseBody = await response.text();

      return {
        status: response.status,
        ok: response.ok,
        body: responseBody,
        headers: headersToRecord(response.headers),
        duration: Date.now() - startTime,
      };
    } catch (error) {
      lastError = normalizeRetryError(error);

      if (attempt === retries) {
        throw createFinalWebhookFetchError(lastError);
      }

      await delayBeforeRetry(retryDelayMs);
    }
  }

  throw new WebhookFetchError('Unexpected error in webhook fetch');
}

export function buildLegacyWebhookRequestInit(options: {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  signal?: AbortSignal;
}): RequestInit {
  return buildWebhookRequestInit({
    body: options.body,
    headers: options.headers || {},
    method: options.method || 'POST',
    signal: options.signal,
  });
}

async function fetchWebhookAttempt({
  body,
  headers,
  method,
  timeoutMs,
  url,
}: WebhookAttemptOptions) {
  let timeoutId: NodeJS.Timeout | null = null;
  const controller = new AbortController();

  if (timeoutMs > 0) {
    timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  }

  try {
    return await fetch(url, buildWebhookRequestInit({
      body,
      headers,
      method,
      signal: timeoutMs > 0 ? controller.signal : undefined,
    }));
  } catch (error) {
    throw normalizeWebhookFetchError(error, timeoutMs);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

function buildWebhookRequestInit({
  body,
  headers,
  method,
  signal,
}: {
  body?: string;
  headers: Record<string, string>;
  method: string;
  signal?: AbortSignal;
}): RequestInit {
  const fetchOptions: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Recruitment-System-Webhook/1.0',
      ...headers,
    },
    ...(signal && { signal }),
    keepalive: true,
  };

  if (body) {
    fetchOptions.body = body;
  }

  return fetchOptions;
}

function normalizeRetryError(error: unknown) {
  return error instanceof Error ? error : new Error(String(error));
}

function createFinalWebhookFetchError(error: Error) {
  if (error instanceof WebhookFetchError) {
    return error;
  }

  return new WebhookFetchError(
    `Webhook request failed: ${error.message}`,
    undefined,
    undefined,
    false
  );
}

function normalizeWebhookFetchError(error: unknown, timeoutMs: number) {
  if (!(error instanceof Error)) {
    return error;
  }

  if (error.name === 'AbortError') {
    return new WebhookFetchError(
      `Request timeout after ${timeoutMs}ms`,
      undefined,
      undefined,
      true
    );
  }

  if (
    error.message.includes('Headers Timeout Error') ||
    error.message.includes('UND_ERR_HEADERS_TIMEOUT')
  ) {
    return new WebhookFetchError(
      'Connection timeout - the external service may be slow or unreachable',
      undefined,
      undefined,
      true
    );
  }

  if (
    error.message.includes('fetch failed') ||
    error.message.includes('ENOTFOUND') ||
    error.message.includes('ECONNREFUSED')
  ) {
    return new WebhookFetchError(
      `Network error: ${error.message}`,
      undefined,
      undefined,
      false
    );
  }

  return error;
}

function headersToRecord(headers: Headers) {
  const responseHeaders: Record<string, string> = {};
  headers.forEach((value, key) => {
    responseHeaders[key] = value;
  });
  return responseHeaders;
}

async function delayBeforeRetry(retryDelayMs: number) {
  if (retryDelayMs > 0) {
    await new Promise(resolve => setTimeout(resolve, retryDelayMs));
  }
}
