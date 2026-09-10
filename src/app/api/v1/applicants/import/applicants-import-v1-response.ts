import { type NextRequest } from 'next/server';
import { handleCors } from '@/lib/cors';

export function jsonV1ApplicantImportResponse(request: NextRequest, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...handleCors(request),
      'Content-Type': 'application/json',
    },
  });
}

export function optionsV1ApplicantImportResponse(request: NextRequest) {
  return new Response(null, { status: 200, headers: handleCors(request) });
}
