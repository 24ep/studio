import { type NextRequest } from 'next/server';
import { handleGetAllPositions } from './positions-all-handlers';

export const dynamic = 'force-dynamic';

/**
 * @openapi
 * /api/positions/all:
 *   get:
 *     summary: Get all positions (no pagination)
 */
export function GET(request: NextRequest) {
  return handleGetAllPositions(request);
}
