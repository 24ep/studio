import { NextResponse, type NextRequest } from 'next/server';
import { logAudit } from '@/lib/auditLog';
import {
  requirePositionInterviewersEditSession,
  requirePositionInterviewersViewSession,
} from './position-interviewers-auth';
import { addPositionInterviewer, fetchPositionInterviewers } from './position-interviewers-data';
import {
  logPositionInterviewerDbError,
  positionInterviewerDbErrorResponse,
  toPositionInterviewerDbError,
} from './position-interviewers-errors';
import { parseAddInterviewerBody, resolvePositionInterviewerPositionId } from './position-interviewers-request';
import type { PositionInterviewersRouteContext } from './position-interviewers-schema';

export async function handleGetPositionInterviewers(
  _request: NextRequest,
  context: PositionInterviewersRouteContext
) {
  const session = await requirePositionInterviewersViewSession();
  if (!session.ok) {
    return session.response;
  }

  const idResolution = await resolvePositionInterviewerPositionId(context);
  if (!idResolution.ok) {
    return idResolution.response;
  }

  try {
    const result = await fetchPositionInterviewers(idResolution.id);
    if (result.status === 'position-not-found') {
      return NextResponse.json({ message: 'Position not found' }, { status: 404 });
    }

    return NextResponse.json(result.interviewers);
  } catch (error: unknown) {
    const dbError = toPositionInterviewerDbError(error);
    console.error(`[Position Interviewers API] Database error fetching interviewers for position ${idResolution.id}:`, error);
    return NextResponse.json({
      message: 'Error fetching interviewers',
      error: dbError.message,
      details: process.env.NODE_ENV === 'development' ? dbError.stack : undefined,
    }, { status: 500 });
  }
}

export async function handleAddPositionInterviewer(
  request: NextRequest,
  context: PositionInterviewersRouteContext
) {
  const session = await requirePositionInterviewersEditSession();
  if (!session.ok) {
    return session.response;
  }

  const idResolution = await resolvePositionInterviewerPositionId(context);
  if (!idResolution.ok) {
    return idResolution.response;
  }

  const parsedBody = await parseAddInterviewerBody(request);
  if (!parsedBody.ok) {
    return parsedBody.response;
  }

  const { userId } = parsedBody.data;

  try {
    const result = await addPositionInterviewer({
      positionId: idResolution.id,
      userId,
      actingUserId: session.actingUserId,
    });

    if (result.status === 'invalid-acting-user') {
      return NextResponse.json({ message: 'Your user account is no longer valid. Please sign out and sign in again.' }, { status: 401 });
    }
    if (result.status === 'position-not-found') {
      return NextResponse.json({ message: 'Position not found' }, { status: 404 });
    }
    if (result.status === 'user-not-found') {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }
    if (result.status === 'duplicate') {
      return NextResponse.json({ message: 'User is already assigned as an interviewer for this position' }, { status: 400 });
    }

    logAudit(
      'AUDIT',
      `Interviewer ${result.user.name} (${result.user.email}) added to position '${result.position.title}' by ${session.actingUserName}.`,
      'API:PositionInterviewers:Add',
      session.actingUserId,
      { positionId: idResolution.id, userId }
    ).catch(err => {
      console.error('[Position Interviewers API] Error logging audit:', err);
    });

    return NextResponse.json({
      message: 'Interviewer added successfully',
      interviewer: result.interviewer,
    }, { status: 201 });
  } catch (error: unknown) {
    const dbError = toPositionInterviewerDbError(error);
    console.error('[Position Interviewers API] Error adding interviewer:', error);
    logPositionInterviewerDbError(error, idResolution.id, userId || 'unknown', session.actingUserId);

    const mappedErrorResponse = positionInterviewerDbErrorResponse(error);
    if (mappedErrorResponse) {
      return mappedErrorResponse;
    }

    logAudit(
      'ERROR',
      `Failed to add interviewer to position. Error: ${dbError.message}`,
      'API:PositionInterviewers:Add',
      session.actingUserId,
      { positionId: idResolution.id, input: parsedBody.body, errorCode: dbError.code, errorDetail: dbError.detail }
    ).catch(err => {
      console.error('[Position Interviewers API] Error logging audit:', err);
    });

    return NextResponse.json({
      message: 'Error adding interviewer',
      error: dbError.message,
      errorCode: dbError.code,
      details: process.env.NODE_ENV === 'development' ? dbError.stack : undefined,
    }, { status: 500 });
  }
}
