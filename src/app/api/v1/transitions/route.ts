import { type NextRequest } from 'next/server';
import { handleCors } from '@/lib/cors';
import { handleCreateV1Transition, handleGetV1Transitions } from './transitions-v1-handlers';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export function GET(request: NextRequest) {
  return handleGetV1Transitions(request);
}

export function POST(request: NextRequest) {
  return handleCreateV1Transition(request);
}

export function OPTIONS(request: NextRequest) {
  return new Response(null, { status: 200, headers: handleCors(request) });
}
