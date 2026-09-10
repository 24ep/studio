import { NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import { auth } from '@/auth';
import { logAudit } from '@/lib/auditLog';
import { hasAnyPermission } from '@/lib/permissions';

export async function requireUserDetailSession(status: 401 | 403) {
  const session = await auth();
  const actingUserId = session?.user?.id;

  if (!actingUserId) {
    return {
      ok: false as const,
      response: NextResponse.json({ message: status === 401 ? 'Unauthorized' : 'Forbidden' }, { status }),
    };
  }

  return { ok: true as const, session, actingUserId };
}

export async function validateUserUpdateAccess(session: Session, actingUserId: string, targetUserId: string) {
  const canEditUsers = hasAnyPermission(session.user, ['USERS_EDIT']);
  const canManageUserPermissions = hasAnyPermission(session.user, ['USERS_PERMISSIONS_MANAGE']);

  if (!canEditUsers && actingUserId !== targetUserId) {
    await logAudit(
      'WARN',
      `Forbidden attempt to update user ${targetUserId} by ${session?.user?.email || 'Unknown'} (ID: ${actingUserId}). Required: USERS_EDIT permission.`,
      'API:Users:Update',
      actingUserId
    );
    return {
      ok: false as const,
      response: NextResponse.json(
        { message: "Forbidden: You don't have permission to modify this user." },
        { status: 403 }
      ),
    };
  }

  return { ok: true as const, canManageUserPermissions };
}

export async function validateRoleUpdateAccess(
  role: string | undefined,
  canManageUserPermissions: boolean,
  session: Session,
  actingUserId: string
) {
  if (canManageUserPermissions || role === undefined) {
    return null;
  }

  await logAudit(
    'WARN',
    `User ${session?.user?.email} attempted to modify role without permission`,
    'API:Users:Update',
    actingUserId
  );
  return NextResponse.json({ message: 'Forbidden: insufficient permissions to modify roles.' }, { status: 403 });
}

export async function validateUserDeleteAccess(session: Session, actingUserId: string, targetUserId: string) {
  const canDeleteUsers = hasAnyPermission(session.user, ['USERS_DELETE']);
  if (!canDeleteUsers && session.user.role !== 'Admin') {
    await logAudit(
      'WARN',
      `Forbidden attempt to delete user ${targetUserId} by ${session?.user?.email || 'Unknown'} (ID: ${actingUserId}). Required: USERS_DELETE permission.`,
      'API:Users:Delete',
      actingUserId,
      { targetUserId }
    );
    return {
      ok: false as const,
      response: NextResponse.json(
        { message: "Forbidden: You don't have permission to delete users." },
        { status: 403 }
      ),
    };
  }

  if (actingUserId === targetUserId) {
    await logAudit(
      'WARN',
      `User ${session?.user?.email || 'Unknown'} (ID: ${actingUserId}) attempted to delete themselves.`,
      'API:Users:Delete',
      actingUserId,
      { targetUserId }
    );
    return {
      ok: false as const,
      response: NextResponse.json({ message: 'Forbidden: You cannot delete your own account.' }, { status: 403 }),
    };
  }

  return { ok: true as const };
}
