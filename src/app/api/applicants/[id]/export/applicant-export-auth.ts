import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { logAudit } from '@/lib/auditLog';
import { hasPermission } from '@/lib/permissions';
import { getSystemSetting } from '@/lib/systemSettings';

export const APPLICANT_EXPORT_AUDIT_ACTION = 'API:Applicant:Export';

export async function requireApplicantExportAccess() {
  const session = await auth();
  const actingUserId = session?.user?.id;
  const actingUserName = (session?.user?.name || session?.user?.email || actingUserId || 'System') as string;

  if (!actingUserId) {
    await logAudit('WARN', 'Unauthorized attempt to export Applicant', APPLICANT_EXPORT_AUDIT_ACTION, null);
    return {
      ok: false as const,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
      actingUserId,
      actingUserName,
    };
  }

  if (!hasPermission(session.user, 'APPLICANTS_EXPORT')) {
    await logAudit('WARN', `Forbidden attempt to export Applicant by ${actingUserName}`, APPLICANT_EXPORT_AUDIT_ACTION, actingUserId);
    return {
      ok: false as const,
      response: NextResponse.json({ error: 'Forbidden: Insufficient permissions to export applicants' }, { status: 403 }),
      actingUserId,
      actingUserName,
    };
  }

  const exportImportFeatureEnabled = await getSystemSetting('exportImportFeatureEnabled');
  if (exportImportFeatureEnabled === 'false') {
    await logAudit('WARN', `Export attempt blocked - feature disabled by ${actingUserName}`, APPLICANT_EXPORT_AUDIT_ACTION, actingUserId);
    return {
      ok: false as const,
      response: NextResponse.json({ error: 'Export/Import feature is disabled' }, { status: 403 }),
      actingUserId,
      actingUserName,
    };
  }

  return { ok: true as const, session, actingUserId, actingUserName };
}
