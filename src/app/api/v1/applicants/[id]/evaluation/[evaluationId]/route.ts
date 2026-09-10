import { type NextRequest } from 'next/server';
import {
  handleDeleteV1ApplicantEvaluation,
  handleGetV1ApplicantEvaluation,
  handleUpdateV1ApplicantEvaluation,
} from './applicant-evaluation-detail-handlers';
import type { ApplicantEvaluationDetailRouteContext } from './applicant-evaluation-detail-schema';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export function GET(request: NextRequest, context: ApplicantEvaluationDetailRouteContext) {
  return handleGetV1ApplicantEvaluation(request, context);
}

export function PUT(request: NextRequest, context: ApplicantEvaluationDetailRouteContext) {
  return handleUpdateV1ApplicantEvaluation(request, context);
}

export function DELETE(request: NextRequest, context: ApplicantEvaluationDetailRouteContext) {
  return handleDeleteV1ApplicantEvaluation(request, context);
}
