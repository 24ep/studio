import { NextResponse, type NextRequest } from 'next/server';
import { logAudit } from '@/lib/auditLog';
import { requireUserGroupPermission, requireUserGroupSession } from './user-group-detail-auth';
import { deleteUserGroup, fetchUserGroupDetail, updateUserGroup } from './user-group-detail-data';
import { validateAndNormalizePermissions } from './user-group-detail-permissions';
import { parseUserGroupUpdateBody, resolveUserGroupId } from './user-group-detail-request';
import type { UserGroupDetailRouteContext } from './user-group-detail-schema';

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export async function handleGetUserGroup(request: NextRequest, context?: UserGroupDetailRouteContext) {
  const idResolution = await resolveUserGroupId(request, context);
  if (!idResolution.ok) {
    return idResolution.response;
  }

  const session = await requireUserGroupSession('json');
  if (!session.ok) {
    return session.response;
  }

  const permissionError = await requireUserGroupPermission(
    session.session,
    'USER_GROUPS_VIEW',
    'API:UserGroups:GetById',
    'GET',
    idResolution.id
  );
  if (permissionError) {
    return permissionError;
  }

  try {
    const group = await fetchUserGroupDetail(idResolution.id);
    if (!group) {
      return NextResponse.json({ message: 'User group (role) not found' }, { status: 404 });
    }

    return NextResponse.json(group, { status: 200 });
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    console.error(`Failed to fetch user group (role) ${idResolution.id}:`, error);
    await logAudit(
      'ERROR',
      `Failed to fetch user group (role) (ID: ${idResolution.id}) by ${session.session?.user?.name}. Error: ${errorMessage}`,
      'API:UserGroups:GetById',
      session.session?.user?.id,
      { targetGroupId: idResolution.id }
    );
    return NextResponse.json({ message: 'Error fetching user group (role)', error: errorMessage }, { status: 500 });
  }
}

export async function handleUpdateUserGroup(request: NextRequest, context?: UserGroupDetailRouteContext) {
  const idResolution = await resolveUserGroupId(request, context);
  if (!idResolution.ok) {
    return idResolution.response;
  }

  const session = await requireUserGroupSession('text');
  if (!session.ok) {
    return session.response;
  }

  const permissionError = await requireUserGroupPermission(
    session.session,
    'USER_GROUPS_EDIT',
    'API:UserGroups:Update',
    'UPDATE',
    idResolution.id
  );
  if (permissionError) {
    return permissionError;
  }

  const parsedBody = await parseUserGroupUpdateBody(request);
  if (!parsedBody.ok) {
    return parsedBody.response;
  }

  const fields = { ...parsedBody.fields };
  if (fields.permissions) {
    const permissions = validateAndNormalizePermissions(fields.permissions);
    if (!permissions.ok) {
      return NextResponse.json({
        message: 'Invalid permissions provided',
        errors: { permissions: [`Invalid permissions: ${permissions.invalidPermissions.join(', ')}`] },
      }, { status: 400 });
    }

    fields.permissions = permissions.permissions;
  }

  if (Object.keys(fields).length === 0) {
    return NextResponse.json({ message: 'No fields to update provided.' }, { status: 400 });
  }

  try {
    const updateResult = await updateUserGroup(idResolution.id, fields);
    if (updateResult.status === 'not-found') {
      return NextResponse.json({ message: 'User group not found' }, { status: 404 });
    }

    if (updateResult.status === 'system-role') {
      console.warn('PUT /api/settings/user-groups/[id] - Attempt to modify system role:', idResolution.id);
      await logAudit(
        'WARN',
        `Attempt to modify system role (ID: ${idResolution.id}) by user ${session.session?.user?.email || 'Unknown'}.`,
        'API:UserGroups:Update',
        session.actingUserId,
        { groupId: idResolution.id }
      );
      return NextResponse.json({ message: 'System roles cannot be modified' }, { status: 403 });
    }

    await logAudit(
      'AUDIT',
      `User group '${updateResult.group.name}' updated.`,
      'API:UserGroups:Update',
      session.actingUserId,
      { groupId: idResolution.id, changes: fields }
    );
    return NextResponse.json(updateResult.group);
  } catch (error: unknown) {
    const errorMessage = getErrorMessage(error);
    console.error(`Failed to update user group ${idResolution.id}:`, error);
    await logAudit(
      'ERROR',
      `Failed to update user group (ID: ${idResolution.id}). Error: ${errorMessage}`,
      'API:UserGroups:Update',
      session.actingUserId,
      { groupId: idResolution.id, input: parsedBody.body }
    );
    return NextResponse.json({ message: 'Error updating user group', error: errorMessage }, { status: 500 });
  }
}

export async function handleDeleteUserGroup(request: NextRequest, context?: UserGroupDetailRouteContext) {
  const idResolution = await resolveUserGroupId(request, context);
  if (!idResolution.ok) {
    return idResolution.response;
  }

  const session = await requireUserGroupSession('text');
  if (!session.ok) {
    return session.response;
  }

  const permissionError = await requireUserGroupPermission(
    session.session,
    'USER_GROUPS_DELETE',
    'API:UserGroups:Delete',
    'DELETE',
    idResolution.id
  );
  if (permissionError) {
    return permissionError;
  }

  try {
    const deletedGroup = await deleteUserGroup(idResolution.id);
    if (!deletedGroup) {
      return NextResponse.json({ message: 'User group not found' }, { status: 404 });
    }

    await logAudit(
      'AUDIT',
      `User group '${deletedGroup.name}' deleted.`,
      'API:UserGroups:Delete',
      session.actingUserId,
      { groupId: idResolution.id }
    );
    return new NextResponse(null, { status: 204 });
  } catch (error: unknown) {
    const errorMessage = getErrorMessage(error);
    console.error(`Failed to delete user group ${idResolution.id}:`, error);
    await logAudit(
      'ERROR',
      `Failed to delete user group (ID: ${idResolution.id}). Error: ${errorMessage}`,
      'API:UserGroups:Delete',
      session.actingUserId,
      { groupId: idResolution.id }
    );
    return NextResponse.json({ message: 'Error deleting user group', error: errorMessage }, { status: 500 });
  }
}
