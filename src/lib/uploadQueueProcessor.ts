import { sendResumeProcessingWebhook } from '@/lib/upload-queue/resume-processing-webhook-client';
import { processBuiltInResumeUploadQueueJob } from '@/lib/upload-queue/built-in-resume-processor';
import { buildResumeProcessingWebhookRequest } from '@/lib/upload-queue/resume-processing-webhook-payload';
import { getResumeProcessingWebhookSettings } from '@/lib/upload-queue/resume-processing-webhook-settings';
import { validateUploadQueueFile } from '@/lib/upload-queue/upload-queue-file-validation';
import {
  dispatchUploadQueueExceptionWebhook,
  dispatchUploadQueueProcessingWebhook,
  failUploadQueueJob,
  updateUploadQueueJobProcessingResult,
} from '@/lib/upload-queue/upload-queue-job-status';
import type { DbClient } from '@/lib/db';

type UploadQueueProcessorJob = Record<string, unknown> & {
  id: string;
  file_name?: string | null;
  file_path?: string | null;
  webhook_payload?: unknown;
};

type ProcessedUploadQueueJob = UploadQueueProcessorJob & {
  status?: string;
  error?: string | null;
  error_details?: string | null;
};

type UploadQueueProcessorResult = {
  job?: ProcessedUploadQueueJob;
  error?: string;
  stack?: string;
  webhook_response?: {
    status: number | null;
    response: string;
  };
};

export async function processSingleUploadQueueJob(
  job: UploadQueueProcessorJob,
  client: DbClient
): Promise<UploadQueueProcessorResult> {
  let payload: unknown = null;

  try {
    const fileValidation = await validateUploadQueueFile(job, client);
    if (!fileValidation.ok) {
      return fileValidation.result ?? { error: 'Invalid upload queue file', job };
    }

    if (!job.file_path) {
      return { error: 'Invalid file_path for job', job };
    }

    const settings = await getResumeProcessingWebhookSettings();
    if (settings.mode === 'built-in') {
      const builtInPayload = await processBuiltInResumeUploadQueueJob({
        client,
        job: { ...job, file_path: job.file_path },
        settings,
      });
      payload = builtInPayload;

      await updateUploadQueueJobProcessingResult(
        client,
        job.id,
        'success',
        null,
        null,
        builtInPayload
      );

      await dispatchUploadQueueProcessingWebhook(job, 'success', null, null);

      if (typeof global !== 'undefined' && typeof global.gc === 'function') {
        global.gc();
      }

      return {
        job: {
          ...job,
          status: 'success',
          error: null,
          error_details: null,
        },
        webhook_response: {
          status: 200,
          response: 'Built-in processing completed',
        },
      };
    }

    const webhookRequest = await buildResumeProcessingWebhookRequest(
      { ...job, file_path: job.file_path },
      settings.responseMode,
      settings.token
    );
    const webhookResult = await sendResumeProcessingWebhook({
      url: settings.url,
      responseMode: settings.responseMode,
      headers: webhookRequest.headers,
      payloadWithIdempotency: webhookRequest.payloadWithIdempotency,
      originalWebhookPayload: job.webhook_payload,
    });
    payload = webhookResult.payload;

    await updateUploadQueueJobProcessingResult(
      client,
      job.id,
      webhookResult.status,
      webhookResult.error,
      webhookResult.errorDetails,
      payload
    );

    await dispatchUploadQueueProcessingWebhook(
      job,
      webhookResult.status,
      webhookResult.error,
      webhookResult.errorDetails
    );

    if (typeof global !== 'undefined' && typeof global.gc === 'function') {
      global.gc();
    }

    return {
      job: {
        ...job,
        status: webhookResult.status,
        error: webhookResult.error,
        error_details: webhookResult.errorDetails,
      },
      webhook_response: {
        status: webhookResult.webhookResStatus,
        response: webhookResult.error || 'Success',
      },
    };
  } catch (err) {
    return handleUploadQueueProcessingException(job, client, payload, err);
  }
}

async function handleUploadQueueProcessingException(
  job: UploadQueueProcessorJob,
  client: DbClient,
  payload: unknown,
  err: unknown
): Promise<UploadQueueProcessorResult> {
  const errorMessage = err instanceof Error ? err.message : String(err);
  const errorStack = err instanceof Error ? err.stack || errorMessage : errorMessage;

  if (job) {
    await failUploadQueueJob(client, job.id, errorMessage, errorStack, payload);
    await dispatchUploadQueueExceptionWebhook(job, errorStack);

    console.error(`Upload queue job '${job.file_name}' failed with exception`, {
      jobId: job.id,
      fileName: job.file_name ?? job.id,
      error: errorMessage,
      stack: errorStack,
    });
  }

  return {
    error: errorMessage,
    stack: err instanceof Error ? err.stack : undefined,
  };
}
