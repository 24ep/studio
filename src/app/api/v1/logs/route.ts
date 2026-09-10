import { type NextRequest } from 'next/server';
import { handleGetV1Logs, handleV1LogsOptions } from './logs-v1-handlers';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * @openapi
 * /api/v1/logs:
 *   get:
 *     summary: Get system logs (V1 API)
 *   options:
 *     summary: CORS preflight
 */
export function GET(request: NextRequest) {
  return handleGetV1Logs(request);
}

export function OPTIONS(request: NextRequest) {
  return handleV1LogsOptions(request);
}
