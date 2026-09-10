import { type NextRequest } from 'next/server';
import { handleCors } from '@/lib/cors';

export const JOB_APPLIED_V1_ENDPOINT = '/api/v1/applicants/[id]/job-applied';

export function jsonResponse(request: NextRequest, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: handleCors(request),
  });
}

export function badRequestResponse(request: NextRequest, details: unknown) {
  return jsonResponse(request, {
    error: 'Invalid input',
    code: 'BAD_REQUEST',
    endpoint: JOB_APPLIED_V1_ENDPOINT,
    details,
  }, 400);
}

export function optionsResponse(request: NextRequest) {
  return new Response(null, { status: 200, headers: handleCors(request) });
}
