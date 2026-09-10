import { type NextRequest } from 'next/server';
import { handleGetUploadQueueV1, handleUploadQueueV1Options } from './upload-queue-v1-handlers';

export const dynamic = 'force-dynamic';

/**
 * @openapi
 * /api/v1/upload-queue:
 *   get:
 *     summary: Get paginated upload queue (V1 API)
 *     description: Returns a paginated list of upload queue jobs. Requires Bearer token authentication.
 *   options:
 *     summary: CORS preflight for upload queue V1 API
 */
export function GET(request: NextRequest) {
  return handleGetUploadQueueV1(request);
}

export function OPTIONS(request: NextRequest) {
  return handleUploadQueueV1Options(request);
}
