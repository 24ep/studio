import { type NextRequest } from 'next/server';
import { readRequestJsonObject } from '@/lib/request-json';
import type { UploadQueueItemRouteContext } from './upload-queue-item-types';

export async function resolveUploadQueueItemId(context: UploadQueueItemRouteContext) {
  const { id } = await context.params;
  return id;
}

export function parseUploadQueuePatchBody(request: NextRequest) {
  return readRequestJsonObject(request);
}
