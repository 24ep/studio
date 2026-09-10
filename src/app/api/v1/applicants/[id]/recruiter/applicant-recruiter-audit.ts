import { logAudit } from '@/lib/auditLog';
import { logApplicantRecruiterFailure } from './applicant-recruiter-errors';

export async function logApplicantRecruiterSuccess(
  message: string,
  action: string,
  userId: string,
  metadata: Record<string, unknown>
) {
  try {
    await logAudit('AUDIT', message, action, userId, metadata);
  } catch (auditError) {
    console.error('[Applicant Recruiter API] Failed to log audit (non-blocking):', auditError);
  }
}

export async function logFailureSafely(input: Parameters<typeof logApplicantRecruiterFailure>[0]) {
  try {
    await logApplicantRecruiterFailure(input);
  } catch (auditError) {
    console.error('[Applicant Recruiter API] Failed to log audit:', auditError);
  }
}
