import { NextResponse, type NextRequest } from 'next/server';
import { requireApplicantEvaluationSession } from './applicant-evaluation-auth';
import { fetchLatestApplicantEvaluation, saveApplicantEvaluation } from './applicant-evaluation-data';
import { applicantEvaluationErrorResponse } from './applicant-evaluation-errors';
import { createEvaluationSchema, type ApplicantEvaluationRouteContext } from './applicant-evaluation-schema';
import { readRequestJsonResult } from '@/lib/request-json';

export async function handleGetApplicantEvaluation(_request: NextRequest, { params }: ApplicantEvaluationRouteContext) {
  try {
    const authorization = await requireApplicantEvaluationSession();
    if (!authorization.ok) {
      return authorization.response;
    }

    const { id: applicantId } = await params;
    return NextResponse.json(await fetchLatestApplicantEvaluation(applicantId) || null);
  } catch (error) {
    console.error('Error fetching Applicant evaluation:', error);
    return NextResponse.json({ error: 'Failed to fetch evaluation' }, { status: 500 });
  }
}

export async function handleCreateApplicantEvaluation(request: NextRequest, { params }: ApplicantEvaluationRouteContext) {
  try {
    const authorization = await requireApplicantEvaluationSession();
    if (!authorization.ok) {
      return authorization.response;
    }

    const { id: applicantId } = await params;
    const bodyResult = await readRequestJsonResult(request);
    const input = createEvaluationSchema.parse(bodyResult.ok ? bodyResult.value : undefined);
    const result = await saveApplicantEvaluation(applicantId, input, authorization.session.user.id);

    if (result.status === 'applicant-not-found') {
      return NextResponse.json({ error: 'Applicant not found' }, { status: 404 });
    }
    if (result.status === 'position-not-found') {
      return NextResponse.json({ error: 'Position not found' }, { status: 404 });
    }
    if (result.status === 'evaluator-not-found') {
      return NextResponse.json({ error: 'Evaluator not found' }, { status: 404 });
    }

    return NextResponse.json(result.evaluation, { status: 201 });
  } catch (error) {
    const mappedError = applicantEvaluationErrorResponse(error);
    if (mappedError) {
      return mappedError;
    }

    console.error('Error creating/updating Applicant evaluation:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to update evaluation', message: errorMessage },
      { status: 500 }
    );
  }
}
