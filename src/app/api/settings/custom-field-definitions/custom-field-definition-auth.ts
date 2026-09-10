import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { logAudit } from '@/lib/auditLog';
import { hasPermission } from '@/lib/permissions';

export async function requireCustomFieldSession() {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      ok: false as const,
      response: NextResponse.json({ message: 'Unauthorized' }, { status: 401 }),
    };
  }

  return {
    ok: true as const,
    session,
  };
}

export async function requireCustomFieldEditSession(auditAction: 'Create' | 'Update' | 'Delete') {
  const sessionResult = await requireCustomFieldSession();
  if (!sessionResult.ok) {
    return sessionResult;
  }

  const { session } = sessionResult;
  if (!hasPermission(session.user, 'CUSTOM_FIELDS_EDIT')) {
    await logAudit(
      'WARN',
      `Forbidden attempt to ${auditAction.toLowerCase()} custom field by ${session.user.name}.`,
      `API:CustomFields:${auditAction}`,
      session.user.id
    );

    return {
      ok: false as const,
      response: NextResponse.json({ message: 'Forbidden: Insufficient permissions' }, { status: 403 }),
    };
  }

  return {
    ok: true as const,
    session,
  };
}
