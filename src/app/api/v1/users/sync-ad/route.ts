import { type NextRequest } from 'next/server';
import { handleV1AzureAdSync } from './sync-ad-v1-handlers';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/v1/users/sync-ad
 * Sync users from Azure AD to the system.
 */
export function POST(request: NextRequest) {
  return handleV1AzureAdSync(request);
}
