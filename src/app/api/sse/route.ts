import { NextRequest } from 'next/server';
import { subscribe } from '@/lib/realtime';

// Force dynamic rendering and disable static optimization
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

export async function OPTIONS(request: NextRequest) {
  // SECURITY: Use proper CORS validation instead of wildcard
  const { getAllowedOrigin } = await import('@/lib/cors');
  const allowedOrigin = getAllowedOrigin(request);
  
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
  
  if (allowedOrigin) {
    headers['Access-Control-Allow-Origin'] = allowedOrigin;
    headers['Access-Control-Allow-Credentials'] = 'true';
  }
  
  return new Response(null, {
    status: 200,
    headers,
  });
}

export async function GET(request: NextRequest) {
  // Minimal SSE subscription using the lightweight hub; avoids DB coupling
  return subscribe(request);
}
