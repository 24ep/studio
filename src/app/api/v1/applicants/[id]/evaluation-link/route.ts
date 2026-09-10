import { type NextRequest } from 'next/server';
import {
  handleCreateApplicantEvaluationLink,
  handleGetApplicantEvaluationLink,
  handleRevokeApplicantEvaluationLink,
  handleUpdateApplicantEvaluationLink,
} from './applicant-evaluation-link-handlers';
import type { ApplicantEvaluationLinkRouteContext } from './applicant-evaluation-link-schema';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export function GET(request: NextRequest, context: ApplicantEvaluationLinkRouteContext) {
  return handleGetApplicantEvaluationLink(request, context);
}

export function POST(request: NextRequest, context: ApplicantEvaluationLinkRouteContext) {
  return handleCreateApplicantEvaluationLink(request, context);
}

export function DELETE(request: NextRequest, context: ApplicantEvaluationLinkRouteContext) {
  return handleRevokeApplicantEvaluationLink(request, context);
}

export function PUT(request: NextRequest, context: ApplicantEvaluationLinkRouteContext) {
  return handleUpdateApplicantEvaluationLink(request, context);
}
