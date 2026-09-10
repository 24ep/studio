import { type NextRequest } from 'next/server';
import { handleGetPositionJobMatches } from './position-job-matches-handler';
import type { PositionJobMatchesRouteContext } from './position-job-matches-schema';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export function GET(request: NextRequest, context: PositionJobMatchesRouteContext) {
  return handleGetPositionJobMatches(request, context);
}
