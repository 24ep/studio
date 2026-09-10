import { NextResponse, type NextRequest } from 'next/server';
import { readRequestJsonResult } from '@/lib/request-json';
import type {
  UploadQueueBulkAction,
  UploadQueueBulkActionBody,
  UploadQueueBulkActionInput,
} from './upload-queue-bulk-action-types';

const VALID_BULK_ACTIONS = new Set<UploadQueueBulkAction>(['retry', 'cancel', 'delete', 'process']);

export async function parseUploadQueueBulkActionRequest(request: NextRequest) {
  const bodyResult = await readRequestJsonResult(request);
  if (!bodyResult.ok) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }),
    };
  }

  const body = bodyResult.value as UploadQueueBulkActionBody;
  const { action, itemIds } = body;
  if (!isValidBulkAction(action)) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: 'Invalid action. Must be retry, cancel, delete, or process' }, { status: 400 }),
    };
  }

  if (!itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: 'Invalid itemIds. Must be a non-empty array' }, { status: 400 }),
    };
  }

  return {
    ok: true as const,
    input: { action, itemIds } satisfies UploadQueueBulkActionInput,
  };
}

function isValidBulkAction(action: unknown): action is UploadQueueBulkAction {
  return typeof action === 'string' && VALID_BULK_ACTIONS.has(action as UploadQueueBulkAction);
}
