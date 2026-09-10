import { NextResponse } from 'next/server';

export type PositionInterviewerDbError = Error & {
  code?: string;
  detail?: string;
  constraint?: string;
  table?: string;
  column?: string;
};

export function toPositionInterviewerDbError(error: unknown): PositionInterviewerDbError {
  return error instanceof Error
    ? error as PositionInterviewerDbError
    : new Error(String(error)) as PositionInterviewerDbError;
}

export function positionInterviewerDbErrorResponse(error: unknown) {
  const dbError = toPositionInterviewerDbError(error);

  if (dbError.code === '23505') {
    return NextResponse.json({ message: 'User is already assigned as an interviewer for this position' }, { status: 400 });
  }

  if (dbError.code === '23503') {
    if (dbError.constraint?.includes('createdBy')) {
      return NextResponse.json({ message: 'Invalid user session. Please refresh and try again.' }, { status: 401 });
    }
    if (dbError.constraint?.includes('positionId')) {
      return NextResponse.json({ message: 'Position not found or has been deleted' }, { status: 404 });
    }
    if (dbError.constraint?.includes('userId')) {
      return NextResponse.json({ message: 'User not found or has been deleted' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Database constraint violation. Please verify the data and try again.' }, { status: 400 });
  }

  if (dbError.code === '23502') {
    return NextResponse.json({ message: 'Required field is missing. Please check your input and try again.' }, { status: 400 });
  }

  return null;
}

export function logPositionInterviewerDbError(
  error: unknown,
  positionId: string,
  userId: string,
  actingUserId?: string
) {
  const dbError = toPositionInterviewerDbError(error);

  console.error('[Position Interviewers API] Error details:', {
    code: dbError.code,
    message: dbError.message,
    detail: dbError.detail,
    constraint: dbError.constraint,
    table: dbError.table,
    column: dbError.column,
    positionId,
    userId,
    actingUserId: actingUserId || 'missing',
    actingUserIdType: typeof actingUserId,
    actingUserIdLength: actingUserId?.length,
  });
}
