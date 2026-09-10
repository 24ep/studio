// src/app/api/positions/import/route.ts
import { type NextRequest } from 'next/server';
import { handleGetImportedPositions } from './positions-import-get';
import { handleImportPositionsPost } from './positions-import-post';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * @openapi
 * /api/positions/import:
 *   get:
 *     summary: Get all imported positions
 *     description: Returns all imported positions. Requires authentication.
 *     responses:
 *       200:
 *         description: List of imported positions
 *   post:
 *     summary: Bulk import positions
 *     description: Import multiple positions at once. Requires authentication.
 *     responses:
 *       201:
 *         description: Import completed
 *       401:
 *         description: Unauthorized
 */
export function POST(request: NextRequest) {
  return handleImportPositionsPost(request);
}

export function GET() {
  return handleGetImportedPositions();
}
