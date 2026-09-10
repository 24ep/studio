import { type NextRequest } from 'next/server';
import { handleCors } from '@/lib/cors';

export function v1BulkActionJsonResponse(request: NextRequest, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: handleCors(request),
  });
}

export function v1BulkActionErrorResponse(request: NextRequest, error: string, status: number, details?: unknown) {
  return v1BulkActionJsonResponse(
    request,
    details === undefined ? { error } : { error, details },
    status
  );
}
