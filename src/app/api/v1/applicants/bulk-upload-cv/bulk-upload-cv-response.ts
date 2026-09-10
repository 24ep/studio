import { type NextRequest } from 'next/server';
import { handleCors } from '@/lib/cors';

export function jsonResponse(request: NextRequest, body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: handleCors(request),
  });
}

export function errorResponse(request: NextRequest, error: string, status: number, details?: unknown) {
  return jsonResponse(
    request,
    details === undefined ? { error } : { error, details },
    status
  );
}
