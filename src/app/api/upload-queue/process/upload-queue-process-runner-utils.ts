import { NextResponse } from 'next/server';
import { broadcastUploadQueueUpdate } from '../sse/broadcastUploadQueueUpdate';
import type { UploadQueueProcessJob } from './upload-queue-process-claim';

export type UploadQueueProcessorResult = {
  job?: UploadQueueProcessJob & {
    status?: string;
    error?: string | null;
    error_details?: string | null;
  };
  error?: string;
  webhook_response?: unknown;
};

export type ProcessorRunResult =
  | { response: NextResponse }
  | {
      status: string;
      error: string | null;
      errorDetails: string | null;
      webhookResults: unknown;
    };

export type CountRow = {
  count: string | number;
};

export function getWebhookPayload(job: UploadQueueProcessJob): Record<string, unknown> {
  return job.webhook_payload && typeof job.webhook_payload === 'object' && !Array.isArray(job.webhook_payload)
    ? job.webhook_payload
    : {};
}

export function isReprocessJob(job: UploadQueueProcessJob) {
  const webhookPayload = getWebhookPayload(job);
  return job.source === 'reprocess' || webhookPayload.source === 'reprocess';
}

export function toProcessorResult(value: unknown): UploadQueueProcessorResult {
  return value && typeof value === 'object'
    ? value as UploadQueueProcessorResult
    : {};
}

export function hasProcessorResponse(result: ProcessorRunResult): result is { response: NextResponse } {
  return 'response' in result;
}

export async function broadcastQueueProgress(label: string): Promise<void> {
  try {
    await broadcastUploadQueueUpdate();
  } catch (broadcastError) {
    console.error(`Failed to broadcast ${label} upload queue update:`, broadcastError);
  }
}

export function getProcessorErrorStatus(error: string): number {
  if (error === 'File too large for processing' || error === 'File download exceeded size limit') {
    return 400;
  }

  return 500;
}
