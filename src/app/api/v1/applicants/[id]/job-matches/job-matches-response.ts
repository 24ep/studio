import { type NextRequest } from 'next/server';
import { handleCors } from '@/lib/cors';

export function jsonCors(request: NextRequest, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: handleCors(request) });
}

export function noContentCors(request: NextRequest) {
  return new Response(null, { status: 200, headers: handleCors(request) });
}

export function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Unknown error';
}

export function getDatabaseErrorDetails(error: unknown) {
  const details = error as { code?: unknown; detail?: unknown; hint?: unknown; stack?: unknown };
  return {
    details: getErrorMessage(error),
    stack: typeof details.stack === 'string' ? details.stack : undefined,
    code: details.code,
    detail: details.detail,
    hint: details.hint,
  };
}
