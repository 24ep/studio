import { NextResponse, type NextRequest } from 'next/server';
import { getPool } from '@/lib/db';
import { requireUploadQueueBulkActionSession } from './upload-queue-bulk-action-auth';
import { processUploadQueueBulkItem } from './upload-queue-bulk-action-item';
import { broadcastUploadQueueBulkActionUpdate } from './upload-queue-bulk-action-notify';
import { parseUploadQueueBulkActionRequest } from './upload-queue-bulk-action-request';
import {
  buildBulkActionMessage,
  createEmptyBulkActionSummary,
  recordBulkItemResult,
} from './upload-queue-bulk-action-results';
import { maybePreCleanRetryBlockingConditions } from './upload-queue-bulk-action-retry-preclean';

export async function handleUploadQueueBulkAction(request: NextRequest) {
  const authorization = await requireUploadQueueBulkActionSession();
  if (!authorization.ok) {
    return authorization.response;
  }

  const parsedRequest = await parseUploadQueueBulkActionRequest(request);
  if (!parsedRequest.ok) {
    return parsedRequest.response;
  }

  const { action, itemIds } = parsedRequest.input;
  const pool = getPool();
  const summary = createEmptyBulkActionSummary();

  await maybePreCleanRetryBlockingConditions(action, pool);

  for (const itemId of itemIds) {
    try {
      const result = await processUploadQueueBulkItem(itemId, action, pool);
      recordBulkItemResult(summary, itemId, result);
    } catch (error) {
      summary.failCount++;
      summary.failedDetails.push({
        itemId,
        reason: error instanceof Error ? error.message : 'Unknown error',
      });
      console.error(`[BULK-ACTION] Unexpected error processing item ${itemId}:`, error);
    }
  }

  await broadcastUploadQueueBulkActionUpdate();

  return NextResponse.json({
    success: true,
    message: buildBulkActionMessage(action, summary),
    successCount: summary.successCount,
    failCount: summary.failCount,
    failedDetails: summary.failedDetails,
  });
}
