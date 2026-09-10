import { type NextRequest } from 'next/server';
import {
  handleCreateApplicantEvaluation,
  handleGetApplicantEvaluation,
} from './applicant-evaluation-handlers';
import type { ApplicantEvaluationRouteContext } from './applicant-evaluation-schema';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export function GET(request: NextRequest, context: ApplicantEvaluationRouteContext) {
  return handleGetApplicantEvaluation(request, context);
}

export function POST(request: NextRequest, context: ApplicantEvaluationRouteContext) {
  return handleCreateApplicantEvaluation(request, context);
}
