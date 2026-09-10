import { NextResponse, type NextRequest } from 'next/server';
import { getSafeDbClient } from '@/lib/db';
import { requireProcessAllApiKey } from './upload-queue-process-all-auth';
import { claimUploadQueueBatch } from './upload-queue-process-all-claim';
import { processClaimedUploadQueueJobs, type ProcessedUploadQueueJobResult } from './upload-queue-process-all-runner';
import { resetInterruptedJobsWithTransaction } from './upload-queue-process-all-reset';
import {
  getProcessAllMaxConcurrent,
  getQueueDisabledResponse,
  hasProcessingTimedOut,
  MAX_PROCESSING_TIME_MS,
} from './upload-queue-process-all-settings';

async function resetInterruptedJobs(messages: string[]) {
  const resetClient = await getSafeDbClient();

  try {
    await resetInterruptedJobsWithTransaction(resetClient, messages);
  } catch (error) {
    console.error('[Process-All] Error resetting stuck jobs:', error);
    messages.push(`Error resetting stuck jobs: ${error instanceof Error ? error.message : 'Unknown error'}`);
  } finally {
    resetClient.release();
  }
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function getErrorStack(error: unknown): string | undefined {
  return error instanceof Error ? error.stack : undefined;
}

function processingTimeoutResponse(processed: ProcessedUploadQueueJobResult[], messages: string[]) {
  return NextResponse.json({
    error: 'Processing time exceeded limit',
    processed_count: processed.length,
    processed,
    messages: [...messages, 'Processing time exceeded limit'],
  }, { status: 408 });
}

export async function handleProcessAllUploadQueueJobs(request: NextRequest) {
  const apiKeyCheck = requireProcessAllApiKey(request);
  if (!apiKeyCheck.ok) {
    return apiKeyCheck.response;
  }

  const processed: ProcessedUploadQueueJobResult[] = [];
  const messages: string[] = [];
  const startTime = Date.now();

  const queueDisabledResponse = await getQueueDisabledResponse();
  if (queueDisabledResponse) {
    return queueDisabledResponse;
  }

  try {
    if (hasProcessingTimedOut(startTime)) {
      console.error(`Batch processing time exceeded limit: ${Date.now() - startTime}ms`);
      return processingTimeoutResponse(processed, messages);
    }

    await resetInterruptedJobs(messages);

    while (!hasProcessingTimedOut(startTime)) {
      const maxConcurrent = await getProcessAllMaxConcurrent();
      const claimResult = await claimUploadQueueBatch({ maxConcurrent, messages, processed });
      if (!claimResult.ok) {
        return claimResult.response;
      }

      if (claimResult.jobs.length === 0) {
        messages.push(processed.length > 0 ? 'No more queued jobs' : 'No queued jobs');
        return NextResponse.json({ processed_count: processed.length, processed, messages }, { status: 200 });
      }

      const results = await processClaimedUploadQueueJobs(claimResult.jobs, startTime);
      processed.push(...results);
    }

    const totalProcessingTime = Date.now() - startTime;
    if (totalProcessingTime > MAX_PROCESSING_TIME_MS) {
      console.warn(`[Process-All] Total processing time exceeded limit: ${totalProcessingTime}ms`);
      messages.push(`Warning: Processing time exceeded limit (${totalProcessingTime}ms)`);
    }

    return NextResponse.json({ processed_count: processed.length, processed, messages }, { status: 200 });
  } catch (err) {
    console.error('[Process-All] Batch upload-queue processing failed:', err);
    return NextResponse.json({
      error: getErrorMessage(err),
      stack: getErrorStack(err),
      processed_count: processed.length,
      processed,
      messages,
    }, { status: 500 });
  }
}
