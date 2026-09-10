import { NextResponse } from 'next/server';
import { z } from 'zod';

export type ApplicantCommentsRouteContext = { params: Promise<{ id: string }> };
export type ApplicantCommentMutationAction = 'edit' | 'delete';
type ApplicantCommentMutationFailureStatus = 'not_found' | 'forbidden';

const uuidSchema = z.string().uuid();

const MUTATION_FAILURE_MESSAGES: Record<
  ApplicantCommentMutationAction,
  Record<ApplicantCommentMutationFailureStatus, { message: string; status: number }>
> = {
  edit: {
    not_found: { message: 'Comment not found', status: 404 },
    forbidden: { message: 'Forbidden: Only the author can edit this comment.', status: 403 },
  },
  delete: {
    not_found: { message: 'Comment not found', status: 404 },
    forbidden: { message: 'Forbidden: Only the author can delete this comment.', status: 403 },
  },
};

export function isValidApplicantCommentsApplicantId(applicantId: string) {
  return uuidSchema.safeParse(applicantId).success;
}

export async function getValidApplicantCommentsApplicantId(context: ApplicantCommentsRouteContext) {
  const { id } = await context.params;
  if (!isValidApplicantCommentsApplicantId(id)) {
    return {
      ok: false as const,
      response: NextResponse.json({ message: 'Invalid Applicant ID format' }, { status: 400 }),
    };
  }

  return { ok: true as const, id };
}

export function getApplicantCommentErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

export function getApplicantCommentMutationFailureResponse(
  status: ApplicantCommentMutationFailureStatus,
  action: ApplicantCommentMutationAction,
) {
  const failure = MUTATION_FAILURE_MESSAGES[action][status];
  return NextResponse.json({ message: failure.message }, { status: failure.status });
}

export function getApplicantCommentContentRequiredResponse() {
  return NextResponse.json({ message: 'Comment content is required' }, { status: 400 });
}

export function getApplicantCommentEditBodyRequiredResponse() {
  return NextResponse.json({ message: 'Comment ID and content are required' }, { status: 400 });
}

export function getApplicantCommentIdRequiredResponse() {
  return NextResponse.json({ message: 'Comment ID is required' }, { status: 400 });
}

export function warnForSlowApplicantCommentsQuery(startTime: number, applicantId: string, now = Date.now()) {
  const queryTime = now - startTime;
  if (queryTime > 3000) {
    console.warn(`[PERF WARNING] Slow comments query: ${queryTime}ms for Applicant ${applicantId}`);
  }
}
