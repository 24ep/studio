import { NextResponse, type NextRequest } from 'next/server';
import { logAudit } from '@/lib/auditLog';
import { requireUserGroupsPermission, requireUserGroupsSession } from './user-groups-auth';
import { createUserGroup, fetchUserGroups } from './user-groups-data';
import { normalizePermissions } from './user-groups-permissions';
import { parseUserGroupCreateBody } from './user-groups-request';

type UserGroupDbError = Error & {
  code?: string;
  constraint?: string;
  detail?: string;
};

function toUserGroupDbError(error: unknown): UserGroupDbError {
  return error instanceof Error ? error as UserGroupDbError : new Error(String(error)) as UserGroupDbError;
}

export async function handleGetUserGroups(_request: NextRequest) {
  const session = await requireUserGroupsSession('json');
  if (!session.ok) {
    return session.response;
  }

  const permissionError = await requireUserGroupsPermission(
    session.session,
    'USER_GROUPS_VIEW',
    'API:UserGroups:GetAll',
    'GET'
  );
  if (permissionError) {
    return permissionError;
  }

  try {
    const groups = await fetchUserGroups();
    return NextResponse.json(groups, { status: 200 });
  } catch (error) {
    const dbError = toUserGroupDbError(error);
    console.error('Failed to fetch user groups:', error);
    await logAudit(
      'ERROR',
      `Failed to fetch user groups by ${session.session?.user?.name}. Error: ${dbError.message}`,
      'API:UserGroups:GetAll',
      session.session?.user?.id
    );
    return NextResponse.json({ message: 'Error fetching user groups', error: dbError.message }, { status: 500 });
  }
}

export async function handleCreateUserGroup(request: NextRequest) {
  const session = await requireUserGroupsSession('text');
  if (!session.ok) {
    return session.response;
  }

  const permissionError = await requireUserGroupsPermission(
    session.session,
    'USER_GROUPS_CREATE',
    'API:UserGroups:Create',
    'CREATE'
  );
  if (permissionError) {
    return permissionError;
  }

  const parsedBody = await parseUserGroupCreateBody(request);
  if (!parsedBody.ok) {
    return parsedBody.response;
  }

  const permissions = normalizePermissions(parsedBody.data.permissions);
  if (parsedBody.data.permissions && permissions.length === 0 && parsedBody.data.permissions.length > 0) {
    return NextResponse.json({
      message: 'Invalid permissions provided',
      errors: { permissions: ['No valid permissions were provided'] },
    }, { status: 400 });
  }

  try {
    const createResult = await createUserGroup({ ...parsedBody.data, permissions });
    if (createResult.status === 'duplicate') {
      return NextResponse.json({
        message: 'A user group with this name already exists',
        error: 'DUPLICATE_NAME',
        existingGroupId: createResult.existingGroupId,
      }, { status: 409 });
    }

    await logAudit(
      'AUDIT',
      `User group '${parsedBody.data.name}' created.`,
      'API:UserGroups:Create',
      session.actingUserId,
      { groupId: createResult.id }
    );
    return NextResponse.json(createResult.group, { status: 201 });
  } catch (error: unknown) {
    const dbError = toUserGroupDbError(error);
    console.error('Failed to create user group:', error);

    const mappedError = mapCreateUserGroupDbError(dbError);
    await logAudit(
      'ERROR',
      `Failed to create group '${parsedBody.data.name}'. Error: ${dbError.message}`,
      'API:UserGroups:Create',
      session.actingUserId,
      { input: parsedBody.body }
    );
    return NextResponse.json({
      message: mappedError.responseMessage,
      error: dbError.message,
      details: dbError.detail || null,
    }, { status: mappedError.responseStatus });
  }
}

function mapCreateUserGroupDbError(error: unknown) {
  const dbError = toUserGroupDbError(error);

  if (dbError.code === '23505' && dbError.constraint === 'UserGroup_name_key') {
    return { ...dbError, responseMessage: 'A user group with this name already exists', responseStatus: 409 };
  }

  if (dbError.code === '23502') {
    return { ...dbError, responseMessage: 'Required field is missing', responseStatus: 400 };
  }

  if (dbError.code === '23514') {
    return { ...dbError, responseMessage: 'Data validation failed', responseStatus: 400 };
  }

  return { ...dbError, responseMessage: 'Error creating user group', responseStatus: 500 };
}
