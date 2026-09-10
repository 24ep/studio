export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { type NextRequest } from 'next/server';
import { handleBulkApplicantActionPost } from './bulk-action-route-handler';

export function POST(request: NextRequest) {
  return handleBulkApplicantActionPost(request);
}

