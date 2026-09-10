import { type NextRequest } from 'next/server';
import {
  handleDeleteApplicantSourceDetail,
  handleGetApplicantSourceDetail,
  handleUpdateApplicantSourceDetail,
} from './applicant-source-detail-handlers';
import type { ApplicantSourceDetailRouteContext } from './applicant-source-detail-schema';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export function GET(request: NextRequest, context: ApplicantSourceDetailRouteContext) {
  return handleGetApplicantSourceDetail(request, context);
}

export function PUT(request: NextRequest, context: ApplicantSourceDetailRouteContext) {
  return handleUpdateApplicantSourceDetail(request, context);
}

export function DELETE(request: NextRequest, context: ApplicantSourceDetailRouteContext) {
  return handleDeleteApplicantSourceDetail(request, context);
}
