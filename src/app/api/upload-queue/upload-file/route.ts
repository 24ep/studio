export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest } from 'next/server';
import { handleUploadFilePost } from './upload-file-route-post';

/**
 * @openapi
 * /api/upload-queue/upload-file:
 *   post:
 *     summary: Upload multiple files to MinIO and add to processing queue
 *     description: Uploads multiple resume files to MinIO storage and adds them to the upload queue for processing. Supports PDF, Word documents, and common image files. Requires authentication.
 *     responses:
 *       200:
 *         description: Files uploaded with detailed results
 *       400:
 *         description: Invalid request (no files, too many files, validation errors)
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 *       500:
 *         description: Internal server error
 */
export function POST(request: NextRequest) {
  return handleUploadFilePost(request);
}
