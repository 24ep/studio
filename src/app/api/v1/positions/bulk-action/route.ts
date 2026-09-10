export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { type NextRequest } from 'next/server';
import { handleCors } from '@/lib/cors';
import { handleV1PositionBulkAction } from './positions-v1-bulk-action-handler';

export function POST(request: NextRequest) {
  return handleV1PositionBulkAction(request);
}

export function OPTIONS(request: NextRequest) {
  return new Response(null, { status: 200, headers: handleCors(request) });
}
