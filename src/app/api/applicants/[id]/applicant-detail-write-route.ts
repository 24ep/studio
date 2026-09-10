// src/app/api/applicants/[id]/applicant-detail-write-route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { logAudit } from '@/lib/auditLog';
import {
  mapApplicantUpdateError,
} from './applicant-detail-route-utils';
import {
  requireApplicantUpdateAccess,
} from './applicant-detail-update-auth';
import {
  beginApplicantUpdateTransaction,
} from './applicant-detail-update-db';
import { readApplicantUpdateRequest } from './applicant-detail-update-request';
import { executeApplicantDetailUpdateTransaction } from './applicant-detail-write-transaction';

type ErrorDiagnostics = {
  code?: unknown;
  constraint?: unknown;
  detail?: unknown;
  hint?: unknown;
  where?: unknown;
  message: string;
  stack?: string;
};

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function getErrorDiagnostics(error: unknown): ErrorDiagnostics {
  const diagnosticSource = error && typeof error === 'object'
    ? error as Record<string, unknown>
    : {};

  return {
    code: diagnosticSource.code,
    constraint: diagnosticSource.constraint,
    detail: diagnosticSource.detail,
    hint: diagnosticSource.hint,
    where: diagnosticSource.where,
    message: getErrorMessage(error),
    stack: error instanceof Error ? error.stack : undefined,
  };
}

function getApplicantUpdateErrorInput(error: unknown): { code?: string; constraint?: string; message: string } {
  const diagnostics = getErrorDiagnostics(error);
  return {
    code: typeof diagnostics.code === 'string' ? diagnostics.code : undefined,
    constraint: typeof diagnostics.constraint === 'string' ? diagnostics.constraint : undefined,
    message: diagnostics.message,
  };
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const access = await requireApplicantUpdateAccess();
  if (!access.ok) {
    return access.response;
  }

  const { session, actingUserId, actingUserName } = access;
  const { id } = await params;

  const updateRequest = await readApplicantUpdateRequest(request);
  if (!updateRequest.ok) {
    return updateRequest.response;
  }

  const { body, updatePayload, transitionNotes, isRead } = updateRequest;
  const requestedTransitionNotes = typeof transitionNotes === 'string' ? transitionNotes : null;
  let client;
  try {
    client = await beginApplicantUpdateTransaction();
    return await executeApplicantDetailUpdateTransaction({
      client,
      sessionUser: session.user,
      applicantId: id,
      actingUserId,
      actingUserName,
      transitionNotes: requestedTransitionNotes,
      updatePayload,
      isRead,
    });
  } catch (error) {
    if (client) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        console.error('Failed to rollback transaction:', rollbackError);
      }
    }
    const errorMessage = getErrorMessage(error);
    console.error('Error updating Applicant:', id, error);
    console.error('Error details:', getErrorDiagnostics(error));
    console.error('Request body that caused the error:', JSON.stringify(body, null, 2));
    try {
      await logAudit('ERROR', `Failed to update Applicant. Error: ${errorMessage}`, 'API:Applicants:Update', actingUserId, { applicantId: id, input: body });
    } catch (auditError) {
      console.error('Failed to log audit entry:', auditError);
    }
    const errorResponse = mapApplicantUpdateError(getApplicantUpdateErrorInput(error));
    return NextResponse.json(errorResponse.body, { status: errorResponse.status });
  } finally {
    if (client) {
      client.release();
    }
  }
}

