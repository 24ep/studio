import type { DbClient } from '@/lib/db';

type UploadQueueJobForWebhook = Record<string, unknown> & {
  id: string;
};

export async function failUploadQueueJob(
  client: DbClient,
  jobId: string,
  error: string,
  errorDetails: string,
  payload?: unknown
) {
  if (payload === undefined) {
    await client.query(
      `UPDATE upload_queue SET status = 'failed', error = $1, error_details = $2, completed_date = now(), updated_at = now() WHERE id = $3`,
      [error, errorDetails, jobId]
    );
    return;
  }

  await client.query(
    `UPDATE upload_queue SET status = 'failed', error = $1, error_details = $2, completed_date = now(), updated_at = now(), webhook_payload = $3 WHERE id = $4`,
    [error, errorDetails, payload, jobId]
  );
}

export async function updateUploadQueueJobProcessingResult(
  client: DbClient,
  jobId: string,
  status: string,
  error: string | null,
  errorDetails: string | null,
  payload: unknown
) {
  await client.query(
    `UPDATE upload_queue SET status = $1, error = $2, error_details = $3, completed_date = now(), updated_at = now(), webhook_payload = $4 WHERE id = $5`,
    [status, error, errorDetails, payload, jobId]
  );
}

export async function dispatchUploadQueueProcessingWebhook(
  job: UploadQueueJobForWebhook,
  status: string,
  error: string | null,
  errorDetails: string | null
) {
  try {
    const { dispatchWebhooks } = await import('@/lib/webhookDispatcher');
    const updatedJob = { ...job, status, error, error_details: errorDetails };

    if (status === 'success') {
      await dispatchWebhooks.uploadQueueCompleted(updatedJob, { processing_result: 'success' });
    } else if (status === 'failed') {
      await dispatchWebhooks.uploadQueueFailed(updatedJob, { error_details: errorDetails || error });
    }
  } catch (webhookDispatchError) {
    console.error(`[Webhook] Failed to dispatch upload queue ${status} webhook for job ${job.id}:`, webhookDispatchError);
  }
}

export async function dispatchUploadQueueExceptionWebhook(job: UploadQueueJobForWebhook, errorDetails: string) {
  try {
    const { dispatchWebhooks } = await import('@/lib/webhookDispatcher');
    const failedJob = { ...job, status: 'failed', error: errorDetails, error_details: errorDetails };
    await dispatchWebhooks.uploadQueueFailed(failedJob, { error_details: errorDetails });
  } catch (webhookDispatchError) {
    console.error(`[Webhook] Failed to dispatch upload queue failed webhook for job ${job.id}:`, webhookDispatchError);
  }
}
