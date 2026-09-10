import { type NextRequest } from 'next/server';
import { handleDashboardV1Options, handleGetDashboardV1 } from './dashboard-v1-handlers';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * @openapi
 * /api/v1/dashboard:
 *   get:
 *     summary: Get dashboard statistics (V1 API)
 *   options:
 *     summary: CORS preflight
 */
export function GET(request: NextRequest) {
  return handleGetDashboardV1(request);
}

export function OPTIONS(request: NextRequest) {
  return handleDashboardV1Options(request);
}
