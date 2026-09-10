import { type NextRequest } from 'next/server';
import { handleCors } from '@/lib/cors';
import { handleV1ApplicantsBulkAction } from './applicants-v1-bulk-action-handler';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export function POST(request: NextRequest) {
  return handleV1ApplicantsBulkAction(request);
}

export function OPTIONS(request: NextRequest) {
  return new Response(null, { status: 200, headers: handleCors(request) });
}
