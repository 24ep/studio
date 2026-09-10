export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { type NextRequest } from 'next/server';
import {
  handleDeleteJobMatchDetail,
  handleGetJobMatchDetail,
  handleJobMatchDetailOptions,
  handleUpdateJobMatchDetail,
} from './job-match-detail-handlers';
import { type JobMatchDetailRouteContext } from './job-match-detail-schema';

export async function GET(request: NextRequest, context: JobMatchDetailRouteContext) {
  return handleGetJobMatchDetail(request, context);
}

export async function PUT(request: NextRequest, context: JobMatchDetailRouteContext) {
  return handleUpdateJobMatchDetail(request, context);
}

export async function DELETE(request: NextRequest, context: JobMatchDetailRouteContext) {
  return handleDeleteJobMatchDetail(request, context);
}

export async function OPTIONS(request: NextRequest) {
  return handleJobMatchDetailOptions(request);
}
