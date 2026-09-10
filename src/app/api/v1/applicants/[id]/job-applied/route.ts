import { type NextRequest } from 'next/server';
import {
  handleDeleteJobAppliedV1,
  handleGetJobAppliedV1,
  handleJobAppliedV1Options,
  handleSaveJobAppliedV1,
} from './job-applied-v1-handlers';
import type { JobAppliedV1RouteContext } from './job-applied-v1-schema';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export function GET(request: NextRequest, context: JobAppliedV1RouteContext) {
  return handleGetJobAppliedV1(request, context);
}

export function POST(request: NextRequest, context: JobAppliedV1RouteContext) {
  return handleSaveJobAppliedV1(request, context, { normalizeBody: true });
}

export function PUT(request: NextRequest, context: JobAppliedV1RouteContext) {
  return handleSaveJobAppliedV1(request, context, { normalizeBody: false });
}

export function DELETE(request: NextRequest, context: JobAppliedV1RouteContext) {
  return handleDeleteJobAppliedV1(request, context);
}

export function OPTIONS(request: NextRequest) {
  return handleJobAppliedV1Options(request);
}
