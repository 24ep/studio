import { type NextRequest } from 'next/server';
import { handleUploadQueueBulkAction } from './upload-queue-bulk-action-handler';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * @openapi
 * /api/upload-queue/bulk-action:
 *   post:
 *     summary: Perform bulk actions on upload queue items
 */
export function POST(request: NextRequest) {
  return handleUploadQueueBulkAction(request);
}
