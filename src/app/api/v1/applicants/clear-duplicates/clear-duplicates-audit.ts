import { logAudit } from '@/lib/auditLog';

export const CLEAR_DUPLICATES_AUDIT_ACTION = 'API:V1:Applicants:ClearDuplicates';

export async function safeLogClearDuplicatesAudit(
  level: 'AUDIT' | 'ERROR',
  message: string,
  userId: string | undefined,
  metadata?: Record<string, unknown>
) {
  try {
    await logAudit(level, message, CLEAR_DUPLICATES_AUDIT_ACTION, userId, metadata);
  } catch (auditError) {
    console.error('[Clear Duplicates] Audit logging failed:', auditError);
  }
}
