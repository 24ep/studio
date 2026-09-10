// src/app/api/logs/route.ts
import { type NextRequest } from 'next/server';
import { handleCreateLogEntry, handleGetLogs } from './logs-route-handlers';

export const dynamic = 'force-dynamic';

/**
 * @openapi
 * /api/logs:
 *   get:
 *     summary: Get system logs
 *   post:
 *     summary: Create a log entry
 */
export function POST(request: NextRequest) {
  return handleCreateLogEntry(request);
}

export function GET(request: NextRequest) {
  return handleGetLogs(request);
}
