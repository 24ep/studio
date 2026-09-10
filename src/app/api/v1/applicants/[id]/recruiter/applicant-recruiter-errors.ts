import { type NextRequest } from 'next/server';
import { logAudit } from '@/lib/auditLog';
import {
  createInternalServerError,
  SimpleErrorHandler,
} from '@/lib/errors';
import type { DbClient } from './applicant-recruiter-data';
import type { ApplicantRecruiterApiUser } from './applicant-recruiter-auth';

export async function rollbackApplicantRecruiterTransaction(client: DbClient) {
  try {
    await client.query('ROLLBACK');
  } catch (rollbackError) {
    console.error('[Applicant Recruiter API] Error during rollback:', rollbackError);
  }
}

export function applicantRecruiterInternalError(req: NextRequest, action: string, error: unknown) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  return SimpleErrorHandler.handleApiError(
    req,
    createInternalServerError(`Error ${action} Applicant recruiter: ${errorMessage}`)
  );
}

export async function logApplicantRecruiterFailure(
  input: {
    action: 'UpdateRecruiter' | 'UnassignRecruiter';
    applicantId: string;
    body?: unknown;
    error: unknown;
    user: ApplicantRecruiterApiUser | null;
  }
) {
  const errorMessage = input.error instanceof Error ? input.error.message : String(input.error);
  const auditAction = `API:V1:Applicants:${input.action}`;
  const actionLabel = input.action === 'UpdateRecruiter' ? 'update Applicant recruiter' : 'unassign Applicant recruiter';
  await logAudit(
    'ERROR',
    `Failed to ${actionLabel} (ID: ${input.applicantId}) by ${input.user?.name || 'Unknown'}. Error: ${errorMessage}`,
    auditAction,
    input.user?.id,
    {
      applicantId: input.applicantId,
      error: errorMessage,
      ...(input.body && typeof input.body === 'object' ? input.body : {}),
    }
  );
}
