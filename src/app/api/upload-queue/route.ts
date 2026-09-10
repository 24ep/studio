import { type NextRequest } from 'next/server';
import { handleUploadQueueGet } from './upload-queue-route-get';
import { handleUploadQueuePost } from './upload-queue-route-post';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * @openapi
 * /api/upload-queue:
 *   get:
 *     summary: Get paginated upload queue
 *     description: Returns a paginated list of upload queue jobs. Requires authentication.
 *     responses:
 *       200:
 *         description: Paginated upload queue
 *       401:
 *         description: Unauthorized
 *   post:
 *     summary: Add a file to the upload queue
 *     description: Adds a new file to the upload queue. Requires authentication.
 *     responses:
 *       201:
 *         description: Upload queue job created
 *       401:
 *         description: Unauthorized
 */
export function GET(request: NextRequest) {
  return handleUploadQueueGet(request);
}

export function POST(request: NextRequest) {
  return handleUploadQueuePost(request);
}
