import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { logAudit } from '@/lib/auditLog';
import { hasPermission } from '@/lib/permissions';
import type { PlatformModuleId } from '@/lib/types';

export async function requireApplicantsRoutePermission(requiredPermission: PlatformModuleId, _request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false as const, response: NextResponse.json({ message: 'Unauthorized' }, { status: 401 }) };
  }

  if (!hasPermission(session.user, requiredPermission)) {
    await logAudit(
      'WARN',
      `Forbidden attempt to access Applicants by ${session.user.name || session.user.email}.`,
      `API:Applicants:${requiredPermission}`,
      session.user.id
    );
    return {
      ok: false as const,
      response: NextResponse.json(
        { message: `Forbidden: Insufficient permissions to ${requiredPermission.toLowerCase().replace('_', ' ')}` },
        { status: 403 }
      ),
    };
  }

  return { ok: true as const, session };
}
