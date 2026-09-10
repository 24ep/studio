import { type NextRequest } from 'next/server';
import { handleCors } from '@/lib/cors';
import { handleDeleteV1Applicant } from './applicant-v1-detail-delete';
import { handleGetV1Applicant } from './applicant-v1-detail-read';
import { handleUpdateV1Applicant } from './applicant-v1-detail-update';
import { type V1ApplicantDetailContext } from './applicant-v1-detail-schema';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export function GET(req: NextRequest, context: V1ApplicantDetailContext) {
  return handleGetV1Applicant(req, context);
}

export function PUT(req: NextRequest, context: V1ApplicantDetailContext) {
  return handleUpdateV1Applicant(req, context);
}

export function DELETE(req: NextRequest, context: V1ApplicantDetailContext) {
  return handleDeleteV1Applicant(req, context);
}

export function OPTIONS(request: NextRequest) {
  return new Response(null, { status: 200, headers: handleCors(request) });
}
