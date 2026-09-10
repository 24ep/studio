import { type NextRequest } from 'next/server';
import { handleCors } from '@/lib/cors';
import {
  handleDeleteApplicantRecruiter,
  handleGetApplicantRecruiter,
  handleUpdateApplicantRecruiter,
} from './applicant-recruiter-handlers';
import type { ApplicantRecruiterRouteContext } from './applicant-recruiter-schema';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export function GET(request: NextRequest, context: ApplicantRecruiterRouteContext) {
  return handleGetApplicantRecruiter(request, context);
}

export function PUT(request: NextRequest, context: ApplicantRecruiterRouteContext) {
  return handleUpdateApplicantRecruiter(request, context);
}

export function DELETE(request: NextRequest, context: ApplicantRecruiterRouteContext) {
  return handleDeleteApplicantRecruiter(request, context);
}

export function OPTIONS(request: NextRequest) {
  const headers = handleCors(request);
  return new Response(null, { status: 200, headers });
}
