export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { type NextRequest } from 'next/server';
import { handleCreateApplicant } from './applicants-route-create';
import { handleListApplicants } from './applicants-route-list';

export function POST(request: NextRequest) {
  return handleCreateApplicant(request);
}

export function GET(request: NextRequest) {
  return handleListApplicants(request);
}
