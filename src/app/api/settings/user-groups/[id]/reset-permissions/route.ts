import { NextResponse, type NextRequest } from 'next/server';
import type { QueryResultRow } from 'pg';
import { auth } from '@/auth';
import { hasPermission } from '@/lib/permissions';
import { logAudit } from '@/lib/auditLog';
import { getPool } from '@/lib/db';
import { getDefaultPermissionsForRole } from '@/lib/default-role-permissions';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type UserGroupResetRow = QueryResultRow & {
  id: string;
  name: string;
  permissions: string[];
  user_count: number;
};

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function extractIdFromUrl(request: NextRequest): string | null {
  const match = request.nextUrl.pathname.match(/\/user-groups\/([^/]+)\/reset-permissions/);
  return match ? match[1] : null;
}

export async function POST(request: NextRequest) {
  const id = extractIdFromUrl(request);
  if (!id) {
    return NextResponse.json({ message: 'Invalid user group ID' }, { status: 400 });
  }

  const { validateUuid } = await import('@/lib/security');
  if (!validateUuid(id)) {
    return NextResponse.json({ message: 'Invalid user group ID format' }, { status: 400 });
  }

  const session = await auth();
  const actingUserId = session?.user?.id;

  if (!actingUserId) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  if (!hasPermission(session.user, 'USER_GROUPS_EDIT')) {
    await logAudit(
      'WARN',
      `Forbidden attempt to reset default permissions for user group (ID: ${id}) by user ${session.user.email}.`,
      'API:UserGroups:ResetPermissions',
      actingUserId,
      { targetGroupId: id }
    );
    return NextResponse.json({ message: 'Forbidden: Insufficient permissions' }, { status: 403 });
  }

  const client = await getPool().connect();

  try {
    const groupResult = await client.query<UserGroupResetRow>(
      `SELECT ug.id, ug.name, ug.permissions, COUNT(u.id)::int AS user_count
       FROM "UserGroup" ug
       LEFT JOIN "User" u ON ug.id = u."userGroupId"
       WHERE ug.id = $1
       GROUP BY ug.id, ug.name, ug.permissions`,
      [id]
    );

    if (groupResult.rowCount === 0) {
      return NextResponse.json({ message: 'User group not found' }, { status: 404 });
    }

    const group = groupResult.rows[0];
    const defaultPermissions = getDefaultPermissionsForRole(group.name);

    if (!defaultPermissions) {
      return NextResponse.json(
        { message: `No default permission template exists for role "${group.name}"` },
        { status: 400 }
      );
    }

    await client.query(
      'UPDATE "UserGroup" SET permissions = $1, "updatedAt" = NOW() WHERE id = $2',
      [defaultPermissions, id]
    );

    await logAudit(
      'AUDIT',
      `User group '${group.name}' permissions reset to default.`,
      'API:UserGroups:ResetPermissions',
      actingUserId,
      {
        groupId: id,
        userCount: group.user_count,
        previousPermissions: group.permissions,
        resetPermissions: defaultPermissions
      }
    );

    return NextResponse.json({
      success: true,
      groupId: id,
      groupName: group.name,
      userCount: group.user_count,
      permissions: defaultPermissions,
      message: `Permissions for "${group.name}" were reset to default.`
    });
  } catch (error: unknown) {
    const errorMessage = getErrorMessage(error);
    console.error(`Failed to reset permissions for user group ${id}:`, error);
    await logAudit(
      'ERROR',
      `Failed to reset permissions for user group (ID: ${id}). Error: ${errorMessage}`,
      'API:UserGroups:ResetPermissions',
      actingUserId,
      { groupId: id }
    );
    return NextResponse.json({ message: 'Error resetting role permissions', error: errorMessage }, { status: 500 });
  } finally {
    client.release();
  }
}
