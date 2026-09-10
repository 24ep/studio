import { type NextRequest } from 'next/server';
import {
  handleAddPositionInterviewer,
  handleGetPositionInterviewers,
} from './position-interviewers-handlers';
import type { PositionInterviewersRouteContext } from './position-interviewers-schema';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export function GET(request: NextRequest, context: PositionInterviewersRouteContext) {
  return handleGetPositionInterviewers(request, context);
}

export function POST(request: NextRequest, context: PositionInterviewersRouteContext) {
  return handleAddPositionInterviewer(request, context);
}
