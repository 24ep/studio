import { NextResponse, type NextRequest } from 'next/server';
import { requireApplicantEvaluationSession } from '../applicant-evaluation-auth';
import { applicantEvaluationErrorResponse } from '../applicant-evaluation-errors';
import {
  deleteApplicantEvaluation,
  fetchApplicantEvaluationById,
  fetchExistingApplicantEvaluation,
  parseEvaluationDetailUpdateBody,
  updateApplicantEvaluationById,
} from './applicant-evaluation-detail-data';
import { updateSiblingEvaluationExpertiseScores } from './applicant-evaluation-detail-expertise';
import { resolveEvaluationDetailParams } from './applicant-evaluation-detail-request';
import type { ApplicantEvaluationDetailRouteContext } from './applicant-evaluation-detail-schema';

export async function handleGetV1ApplicantEvaluation(_request: NextRequest, context: ApplicantEvaluationDetailRouteContext) {
  try {
    const session = await requireApplicantEvaluationSession();
    if (!session.ok) {
      return session.response;
    }

    const { evaluationId } = await resolveEvaluationDetailParams(context);
    const evaluation = await fetchApplicantEvaluationById(evaluationId);
    if (!evaluation) {
      return NextResponse.json({ error: 'Evaluation not found' }, { status: 404 });
    }

    return NextResponse.json(evaluation);
  } catch (error) {
    console.error('Error fetching evaluation:', error);
    return NextResponse.json({ error: 'Failed to fetch evaluation' }, { status: 500 });
  }
}

export async function handleUpdateV1ApplicantEvaluation(request: NextRequest, context: ApplicantEvaluationDetailRouteContext) {
  try {
    const session = await requireApplicantEvaluationSession();
    if (!session.ok) {
      return session.response;
    }

    const { evaluationId } = await resolveEvaluationDetailParams(context);
    const input = await parseEvaluationDetailUpdateBody(request);
    const existingEvaluation = await fetchExistingApplicantEvaluation(evaluationId);
    if (!existingEvaluation) {
      return NextResponse.json({ error: 'Evaluation not found' }, { status: 404 });
    }

    const updateResult = await updateApplicantEvaluationById(evaluationId, existingEvaluation, input);
    await updateSiblingEvaluationExpertiseScores(
      existingEvaluation.applicantId,
      evaluationId,
      updateResult.uniqueScores.expertiseScores
    );

    return NextResponse.json(updateResult.evaluation);
  } catch (error) {
    const mappedError = applicantEvaluationErrorResponse(error);
    if (mappedError) {
      return mappedError;
    }

    console.error('Error updating evaluation:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to update evaluation', message: errorMessage },
      { status: 500 }
    );
  }
}

export async function handleDeleteV1ApplicantEvaluation(_request: NextRequest, context: ApplicantEvaluationDetailRouteContext) {
  try {
    const session = await requireApplicantEvaluationSession();
    if (!session.ok) {
      return session.response;
    }

    const { evaluationId } = await resolveEvaluationDetailParams(context);
    const existingEvaluation = await fetchExistingApplicantEvaluation(evaluationId);
    if (!existingEvaluation) {
      return NextResponse.json({ error: 'Evaluation not found' }, { status: 404 });
    }

    await deleteApplicantEvaluation(evaluationId);
    return NextResponse.json({ message: 'Evaluation deleted successfully' });
  } catch (error) {
    console.error('Error deleting evaluation:', error);
    return NextResponse.json({ error: 'Failed to delete evaluation' }, { status: 500 });
  }
}
