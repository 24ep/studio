import { webhookFetch, WebhookFetchError } from '@/lib/webhookFetch';

export interface ResumeProcessingWebhookRequest {
  url: string;
  responseMode: string;
  headers: Record<string, string>;
  payloadWithIdempotency: unknown;
  originalWebhookPayload?: unknown;
}

export interface ResumeProcessingWebhookResult {
  status: string;
  error: string | null;
  errorDetails: string | null;
  webhookResStatus: number | null;
  webhookResponseText: string | null;
  payload: Record<string, unknown>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export async function sendResumeProcessingWebhook(
  request: ResumeProcessingWebhookRequest
): Promise<ResumeProcessingWebhookResult> {
  if (!request.url || !request.url.startsWith('http')) {
    const webhookError = 'Webhook URL not set or invalid, skipping webhook file send.';
    console.warn('[Webhook Skipped]', webhookError);
    return createSkippedWebhookResult(webhookError);
  }

  const delivery = await deliverResumeProcessingWebhook(request);

  return {
    ...delivery,
    payload: buildResumeProcessingPayload(request, delivery),
  };
}

function createSkippedWebhookResult(webhookError: string): ResumeProcessingWebhookResult {
  return {
    status: 'failed',
    error: webhookError,
    errorDetails: webhookError,
    webhookResStatus: null,
    webhookResponseText: null,
    payload: { error: webhookError },
  };
}

function buildResumeProcessingPayload(
  request: ResumeProcessingWebhookRequest,
  delivery: Omit<ResumeProcessingWebhookResult, 'payload'>
): Record<string, unknown> {
  return {
    ...(isRecord(request.originalWebhookPayload) ? request.originalWebhookPayload : {}),
    webhookUrl: request.url,
    method: 'POST',
    headers: request.headers,
    responseMode: request.responseMode,
    webhookResStatus: delivery.webhookResStatus,
    webhookResponseText: delivery.webhookResponseText,
    webhookError: delivery.status === 'failed' ? delivery.error : undefined,
    originalPayload: request.payloadWithIdempotency,
  };
}

async function deliverResumeProcessingWebhook(
  request: ResumeProcessingWebhookRequest
): Promise<Omit<ResumeProcessingWebhookResult, 'payload'>> {
  try {
    const webhookResult = await webhookFetch({
      url: request.url,
      method: 'POST',
      headers: request.headers,
      body: JSON.stringify(request.payloadWithIdempotency),
      timeoutMs: 0,
      retries: 0,
    });

    return analyzeResumeProcessingResponse(webhookResult.status, webhookResult.body);
  } catch (fetchError) {
    return createWebhookFetchErrorResult(fetchError);
  }
}

function analyzeResumeProcessingResponse(
  webhookResStatus: number,
  webhookResponseText: string | null
): Omit<ResumeProcessingWebhookResult, 'payload'> {
  const analysis = getResponseSuccessAnalysis(webhookResStatus, webhookResponseText);

  if (analysis.isSuccess) {
    return {
      status: 'success',
      error: null,
      errorDetails: null,
      webhookResStatus,
      webhookResponseText,
    };
  }

  return {
    status: 'failed',
    error: `Webhook responded with status ${webhookResStatus}`,
    errorDetails: buildWebhookFailureDetails(webhookResStatus, analysis.responseAnalysis, webhookResponseText),
    webhookResStatus,
    webhookResponseText,
  };
}

function getResponseSuccessAnalysis(webhookResStatus: number, webhookResponseText: string | null) {
  if (webhookResStatus === 200) {
    return { isSuccess: true, responseAnalysis: 'HTTP 200 OK' };
  }

  try {
    if (!webhookResponseText) {
      return { isSuccess: false, responseAnalysis: `HTTP ${webhookResStatus} with no response body` };
    }

    const responseData = JSON.parse(webhookResponseText) as unknown;
    const responseBody = isRecord(responseData) ? responseData : {};
    const responseDataBody = isRecord(responseBody.data) ? responseBody.data : {};
    const responseBodySuccess = responseBody.success === true
      || responseDataBody.success === true
      || responseBody.status === 'success'
      || responseDataBody.status === 'success';

    return {
      isSuccess: responseBodySuccess,
      responseAnalysis: responseBodySuccess
        ? `HTTP ${webhookResStatus} but response body indicates success`
        : `HTTP ${webhookResStatus} and response body indicates failure`,
    };
  } catch {
    return { isSuccess: false, responseAnalysis: `HTTP ${webhookResStatus} with unparseable response body` };
  }
}

function buildWebhookFailureDetails(
  webhookResStatus: number,
  responseAnalysis: string,
  webhookResponseText: string | null
) {
  const truncatedResponse = webhookResponseText && webhookResponseText.length > 200
    ? `${webhookResponseText.substring(0, 200)}...`
    : webhookResponseText;

  return `The external resume processing service returned status ${webhookResStatus}. ${getStatusGuidance(webhookResStatus)}


Status: ${webhookResStatus}
Response Analysis: ${responseAnalysis}
Response: ${truncatedResponse || 'No response body'}`;
}

function getStatusGuidance(webhookResStatus: number) {
  if (webhookResStatus >= 500) {
    return 'This is a server error (5xx), indicating the external service is experiencing issues.';
  }
  if (webhookResStatus >= 400) {
    return 'This is a client error (4xx), indicating the request may be malformed or unauthorized.';
  }
  if (webhookResStatus >= 300) {
    return 'This is a redirect (3xx), which may indicate configuration issues.';
  }
  return 'This is an unexpected status code.';
}

function createWebhookFetchErrorResult(
  fetchError: unknown
): Omit<ResumeProcessingWebhookResult, 'payload'> {
  if (fetchError instanceof WebhookFetchError) {
    const errorDetails = fetchError.isTimeout
      ? `Failed to connect to webhook service: ${fetchError.message}

This appears to be a timeout issue. Consider reducing the webhook timeout setting or checking if the external service is slow.`
      : `Failed to connect to webhook service: ${fetchError.message}`;

    return {
      status: 'failed',
      error: fetchError.isTimeout ? 'Webhook timeout error' : 'Webhook fetch error',
      errorDetails,
      webhookResStatus: null,
      webhookResponseText: null,
    };
  }

  return {
    status: 'failed',
    error: 'Webhook fetch error',
    errorDetails: `Failed to connect to webhook service. Error: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}`,
    webhookResStatus: null,
    webhookResponseText: null,
  };
}
