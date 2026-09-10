import { type NextRequest } from 'next/server';
import { handleGetFitScoreCounts } from './fit-score-counts-handlers';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export function GET(request: NextRequest) {
  return handleGetFitScoreCounts(request);
}
