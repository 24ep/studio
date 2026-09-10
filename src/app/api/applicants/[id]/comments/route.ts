import { NextResponse, type NextRequest } from 'next/server';
import {
  getApplicantCommentPostTypeError,
  getApplicantCommentViewAccess,
  requireApplicantCommentsSession,
  requireCanAddApplicantComment,
} from './applicant-comments-auth';
import { createApplicantComment, deleteApplicantComment, fetchApplicantCommentsPage, updateApplicantComment } from './applicant-comments-data';
import {
  publishApplicantCommentCreated,
  publishApplicantCommentDeleted,
  publishApplicantCommentUpdated,
} from './applicant-comments-events';
import { parseApplicantCommentsPagination, parseApplicantCommentWriteBody } from './applicant-comments-request';
import {
  getApplicantCommentContentRequiredResponse,
  getApplicantCommentEditBodyRequiredResponse,
  getApplicantCommentErrorMessage,
  getApplicantCommentIdRequiredResponse,
  getApplicantCommentMutationFailureResponse,
  getValidApplicantCommentsApplicantId,
  type ApplicantCommentsRouteContext,
  warnForSlowApplicantCommentsQuery,
} from './applicant-comments-route-utils';
import { getJsonString } from '@/lib/json-types';
import { readRequestJsonObject } from '@/lib/request-json';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, context: ApplicantCommentsRouteContext) {
  const idResult = await getValidApplicantCommentsApplicantId(context);
  if (!idResult.ok) return idResult.response;

  const startTime = Date.now();

  try {
    const sessionResult = await requireApplicantCommentsSession();
    if (!sessionResult.ok) return sessionResult.response;

    const access = getApplicantCommentViewAccess(sessionResult.session.user);
    if (!access.canViewAll && !access.canViewRemarks) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const page = await fetchApplicantCommentsPage({
      applicantId: idResult.id,
      ...parseApplicantCommentsPagination(request),
      ...access,
    });

    if (!page) {
      return NextResponse.json({ message: 'Applicant not found' }, { status: 404 });
    }

    warnForSlowApplicantCommentsQuery(startTime, idResult.id);

    return NextResponse.json(page);
  } catch (error) {
    console.error(`[GET /api/applicants/${idResult.id}/comments] Error:`, error);
    return NextResponse.json(
      { message: 'Internal server error', error: getApplicantCommentErrorMessage(error) },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest, context: ApplicantCommentsRouteContext) {
  const idResult = await getValidApplicantCommentsApplicantId(context);
  if (!idResult.ok) return idResult.response;

  const sessionResult = await requireApplicantCommentsSession();
  if (!sessionResult.ok) return sessionResult.response;

  const canAddResult = await requireCanAddApplicantComment(idResult.id, sessionResult.session.user);
  if (!canAddResult.ok) return canAddResult.response;

  const parsedBody = await parseApplicantCommentWriteBody(request);
  if (!parsedBody.content) {
    return getApplicantCommentContentRequiredResponse();
  }

  const postTypeError = getApplicantCommentPostTypeError(sessionResult.session.user, parsedBody.type);
  if (postTypeError) {
    return NextResponse.json({ message: postTypeError }, { status: 403 });
  }

  try {
    const created = await createApplicantComment({
      applicantId: idResult.id,
      userId: sessionResult.session.user.id,
      content: parsedBody.content,
      type: parsedBody.type,
      files: parsedBody.files,
      labels: parsedBody.labels,
    });

    await publishApplicantCommentCreated(idResult.id, created.raw, sessionResult.session.user.id);

    return NextResponse.json({ data: created.response }, { status: 201 });
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json({ message: 'Error creating comment', error: String(error) }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: ApplicantCommentsRouteContext) {
  const idResult = await getValidApplicantCommentsApplicantId(context);
  if (!idResult.ok) return idResult.response;

  const sessionResult = await requireApplicantCommentsSession();
  if (!sessionResult.ok) return sessionResult.response;

  const parsedBody = await parseApplicantCommentWriteBody(request);
  if (!parsedBody.commentId || !parsedBody.content) {
    return getApplicantCommentEditBodyRequiredResponse();
  }

  try {
    const updated = await updateApplicantComment({
      applicantId: idResult.id,
      userId: sessionResult.session.user.id,
      commentId: parsedBody.commentId,
      content: parsedBody.content,
      files: parsedBody.files,
      labels: parsedBody.labels,
    });

    if (updated.status === 'not_found' || updated.status === 'forbidden') {
      return getApplicantCommentMutationFailureResponse(updated.status, 'edit');
    }

    await publishApplicantCommentUpdated(idResult.id, updated.raw, sessionResult.session.user.id);

    return NextResponse.json({ data: updated.response });
  } catch (error) {
    console.error('Error updating comment:', error);
    return NextResponse.json({ message: 'Error updating comment', error: String(error) }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: ApplicantCommentsRouteContext) {
  const idResult = await getValidApplicantCommentsApplicantId(context);
  if (!idResult.ok) return idResult.response;

  const sessionResult = await requireApplicantCommentsSession();
  if (!sessionResult.ok) return sessionResult.response;

  const body = await readRequestJsonObject(request);
  const commentId = getJsonString(body, 'commentId');
  if (!commentId) {
    return getApplicantCommentIdRequiredResponse();
  }

  try {
    const deleted = await deleteApplicantComment({
      applicantId: idResult.id,
      userId: sessionResult.session.user.id,
      commentId,
    });

    if (deleted.status === 'not_found' || deleted.status === 'forbidden') {
      return getApplicantCommentMutationFailureResponse(deleted.status, 'delete');
    }

    await publishApplicantCommentDeleted(idResult.id, deleted.comment, sessionResult.session.user.id);

    return NextResponse.json({ message: 'Deleted' });
  } catch (error) {
    return NextResponse.json({ message: 'Error deleting comment', error: String(error) }, { status: 500 });
  }
}
