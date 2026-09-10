import { type NextRequest } from 'next/server';
import { handleGetPositionApplicants } from './position-applicants-route-get';
import { type PositionApplicantsRouteContext } from './position-applicants-route-types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export function GET(request: NextRequest, context: PositionApplicantsRouteContext) {
  return handleGetPositionApplicants(request, context);
}
