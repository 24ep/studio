import { type NextRequest } from 'next/server';
import { getAllowedOrigin } from '@/lib/cors';

export function handleV1ApplicantsOptions(request: NextRequest) {
  const allowedOrigin = getAllowedOrigin(request);
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (allowedOrigin) {
    headers['Access-Control-Allow-Origin'] = allowedOrigin;
    headers['Access-Control-Allow-Credentials'] = 'true';
  }

  return new Response(null, { status: 200, headers });
}
