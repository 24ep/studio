import { type NextRequest, NextResponse } from 'next/server';
import { getSafeDbClient } from '@/lib/db';
import { isValidProcessorApiKey } from '@/lib/processor-auth';
import { getSystemSetting } from '@/lib/systemSettings';
import { claimNextUploadQueueJob } from './upload-queue-process-claim';
import { processClaimedUploadQueueJob } from './upload-queue-process-runner';
import type { UploadQueueProcessJob } from './upload-queue-process-claim';

export const dynamic = 'force-dynamic';

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function getErrorStack(error: unknown): string | undefined {
  return error instanceof Error ? error.stack : undefined;
}

/**
 * @openapi
 * /api/upload-queue/process:
 *   post:
 *     summary: Process the next queued upload job
 *     description: Processes the next file in the upload queue by sending it to an automation webhook. Requires authentication. Not for public use.
 *     responses:
 *       200:
 *         description: Job processed (or no jobs)
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Error processing job
 */
export async function POST(request: NextRequest) {
  const apiKey = request.headers.get('x-api-key');

  if (!isValidProcessorApiKey(apiKey)) {
    console.warn('Unauthorized attempt to process upload queue with invalid API key', {
      providedKey: apiKey ? 'present' : 'missing',
    });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();

  try {
    const queueEnabled = await getSystemSetting('processQueueEnabled');
    if (queueEnabled === 'false') {
      return NextResponse.json({
        message: 'Process queue is disabled',
        enabled: false,
      }, { status: 200 });
    }
  } catch (error) {
    console.warn('Failed to check process queue enabled status:', error);
  }

  const client = await getSafeDbClient();
  let job: UploadQueueProcessJob | null = null;

  try {
    const claimResult = await claimNextUploadQueueJob(client);
    if (!claimResult.ok) {
      return claimResult.response;
    }

    job = claimResult.job;
    return await processClaimedUploadQueueJob(job, client, startTime);
  } catch (err) {
    const errorMessage = getErrorMessage(err);
    const errorStack = getErrorStack(err) || errorMessage;

    if (job) {
      await client.query(
        `UPDATE upload_queue SET status = 'failed', error = $1, error_details = $2, completed_date = now(), updated_at = now(), webhook_payload = $3 WHERE id = $4`,
        [errorMessage, errorStack, null, job.id]
      );
      console.error(`Upload queue job '${job.file_name}' failed with exception`, {
        jobId: job.id,
        fileName: job.file_name,
        error: errorMessage,
        stack: errorStack,
      });
    }

    const isDevelopment = process.env.NODE_ENV === 'development';
    return NextResponse.json(
      {
        error: isDevelopment ? errorMessage : 'An error occurred while processing the upload',
        ...(isDevelopment && { stack: getErrorStack(err) }),
      },
      { status: 500 }
    );
  } finally {
    try {
      client.release();
    } catch (releaseError) {
      console.error('Error releasing database client:', releaseError);
    }
  }
}
