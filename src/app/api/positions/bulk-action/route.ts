// src/app/api/positions/bulk-action/route.ts
import { type NextRequest } from 'next/server';
import { handlePositionBulkAction } from './position-bulk-action-handler';

export const dynamic = 'force-dynamic';

export function POST(request: NextRequest) {
  return handlePositionBulkAction(request);
}
