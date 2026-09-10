import { type NextRequest } from 'next/server';
import { handleClearDuplicateApplicants } from './clear-duplicates-handler';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export function POST(request: NextRequest) {
  return handleClearDuplicateApplicants(request);
}
