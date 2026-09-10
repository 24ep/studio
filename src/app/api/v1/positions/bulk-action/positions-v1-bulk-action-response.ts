import type { NextRequest } from 'next/server';
import { handleCors } from '@/lib/cors';

export function v1PositionBulkActionResponse(
  request: NextRequest,
  body: unknown,
  status: number
) {
  return new Response(JSON.stringify(body), {
    status,
    headers: handleCors(request),
  });
}

export function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
