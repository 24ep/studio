import { NextResponse } from 'next/server';
import { hasPermission } from '@/lib/permissions';
import { getSystemSetting } from '@/lib/systemSettings';
import { logAudit } from '@/lib/auditLog';
import { auth } from '@/auth';

interface ImportAuthOptions {
  auditUnauthorized?: boolean;
  auditForbidden?: boolean;
}

export interface ApplicantImportActor {
  actingUserId: string;
  actingUserName: string;
}

export async function requireApplicantImportAccess(options: ImportAuthOptions = {}) {
  const session = await auth();
  const actingUserId = session?.user?.id;
  const actingUserName = (session?.user?.name || session?.user?.email || actingUserId || 'System') as string;

  if (!actingUserId) {
    if (options.auditUnauthorized) {
      await logAudit('WARN', 'Unauthorized attempt to import Applicants', 'API:Applicants:Import', null);
    }
    return {
      ok: false as const,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }

  if (!hasPermission(session.user, 'applicantS_IMPORT')) {
    if (options.auditForbidden) {
      await logAudit('WARN', `Forbidden attempt to import Applicants by ${actingUserName}`, 'API:Applicants:Import', actingUserId);
    }
    return {
      ok: false as const,
      response: NextResponse.json({ error: 'Forbidden: Insufficient permissions to import Applicants' }, { status: 403 }),
    };
  }

  const exportImportFeatureEnabled = await getSystemSetting('exportImportFeatureEnabled');
  if (exportImportFeatureEnabled === 'false') {
    if (options.auditForbidden) {
      await logAudit('WARN', `Import attempt blocked - feature disabled by ${actingUserName}`, 'API:Applicants:Import', actingUserId);
    }
    return {
      ok: false as const,
      response: NextResponse.json({ error: 'Export/Import feature is disabled' }, { status: 403 }),
    };
  }

  return {
    ok: true as const,
    actor: { actingUserId, actingUserName },
  };
}
