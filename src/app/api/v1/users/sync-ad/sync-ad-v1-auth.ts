import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { isAzureADConfigured } from '@/lib/auth';
import { logAudit } from '@/lib/auditLog';
import { hasAnyPermission } from '@/lib/permissions';

export async function requireV1AzureAdSyncAccess() {
  const session = await auth();

  if (!session) {
    return {
      ok: false as const,
      response: NextResponse.json(
        {
          success: false,
          message: 'Unauthorized: User session required.',
        },
        { status: 401 },
      ),
    };
  }

  if (!hasAnyPermission(session.user, ['USERS_CREATE'])) {
    await logAudit(
      'WARN',
      `Forbidden attempt to sync AD users by ${session?.user?.email || 'Unknown'} (ID: ${session?.user?.id || 'N/A'}). Required: USERS_CREATE permission.`,
      'API:V1:Users:SyncAD',
      session?.user?.id,
    );
    return {
      ok: false as const,
      response: NextResponse.json(
        {
          success: false,
          message: 'Forbidden: You must have USERS_CREATE permission to sync users from Azure AD.',
        },
        { status: 403 },
      ),
    };
  }

  if (!isAzureADConfigured()) {
    return {
      ok: false as const,
      response: NextResponse.json(
        {
          success: false,
          message: 'Azure AD is not configured. Please configure Azure AD credentials in environment variables.',
        },
        { status: 400 },
      ),
    };
  }

  return { ok: true as const, session };
}
