import { NextResponse, type NextRequest } from 'next/server';
import { logAudit } from '@/lib/auditLog';
import {
  requireUserDetailSession,
  validateRoleUpdateAccess,
  validateUserDeleteAccess,
  validateUserUpdateAccess,
} from './user-detail-auth';
import { deleteUserById, getUserWithGroupTeam, hasUserUpdatePayload, updateUserById } from './user-detail-data';
import {
  logInvalidUserId,
  parseUpdateUserBody,
  resolveUserId,
  validateUpdateUserBodySize,
} from './user-detail-request';
import { type UserDetailRouteContext } from './user-detail-schema';

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function getErrorCode(error: unknown): string | undefined {
  if (!error || typeof error !== 'object' || !('code' in error)) {
    return undefined;
  }

  const code = error.code;
  return typeof code === 'string' ? code : undefined;
}

export async function handleGetUserDetail(request: NextRequest, context?: UserDetailRouteContext) {
  const idResolution = await resolveUserId(request, context);
  if (!idResolution.ok) {
    logInvalidUserId('GET', idResolution.id);
    return idResolution.response;
  }

  const session = await requireUserDetailSession(401);
  if (!session.ok) {
    return session.response;
  }

  try {
    const user = await getUserWithGroupTeam(idResolution.id);
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user, { status: 200 });
  } catch (error: unknown) {
    const errorMessage = getErrorMessage(error);
    console.error(`Failed to fetch user ${idResolution.id}:`, error);
    return NextResponse.json({
      message: 'Error fetching user',
      ...(process.env.NODE_ENV === 'development' && { error: errorMessage }),
    }, { status: 500 });
  }
}

export async function handleUpdateUser(request: NextRequest, context?: UserDetailRouteContext) {
  const idResolution = await resolveUserId(request, context);
  if (!idResolution.ok) {
    logInvalidUserId('PUT', idResolution.id);
    return idResolution.response;
  }

  const session = await requireUserDetailSession(403);
  if (!session.ok) {
    return session.response;
  }

  const updateAccess = await validateUserUpdateAccess(session.session, session.actingUserId, idResolution.id);
  if (!updateAccess.ok) {
    return updateAccess.response;
  }

  const bodySizeError = validateUpdateUserBodySize(request);
  if (bodySizeError) {
    return bodySizeError;
  }

  const parsedBody = await parseUpdateUserBody(request);
  if (!parsedBody.ok) {
    return parsedBody.response;
  }

  if (!hasUserUpdatePayload(parsedBody.data)) {
    return NextResponse.json({ message: 'No fields to update.' }, { status: 400 });
  }

  const roleAccessError = await validateRoleUpdateAccess(
    parsedBody.data.role,
    updateAccess.canManageUserPermissions,
    session.session,
    session.actingUserId
  );
  if (roleAccessError) {
    return roleAccessError;
  }

  try {
    const updatedUser = await updateUserById(idResolution.id, parsedBody.data);
    await logAudit(
      'AUDIT',
      `User '${updatedUser.name}' (ID: ${idResolution.id}) was updated.`,
      'API:Users:Update',
      session.actingUserId,
      { targetUserId: idResolution.id, changes: parsedBody.data }
    );

    return NextResponse.json(updatedUser, { status: 200 });
  } catch (error: unknown) {
    const errorMessage = getErrorMessage(error);
    console.error(`Failed to update user ${idResolution.id}:`, error);
    await logAudit(
      'ERROR',
      `Failed to update user (ID: ${idResolution.id}). Error: ${errorMessage}`,
      'API:Users:Update',
      session.actingUserId,
      { targetUserId: idResolution.id, input: parsedBody.body }
    );

    if (getErrorCode(error) === 'P2025') {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Error updating user', error: errorMessage }, { status: 500 });
  }
}

export async function handleDeleteUser(request: NextRequest, context?: UserDetailRouteContext) {
  const idResolution = await resolveUserId(request, context);
  if (!idResolution.ok) {
    logInvalidUserId('DELETE', idResolution.id);
    return idResolution.response;
  }

  const session = await requireUserDetailSession(403);
  if (!session.ok) {
    return session.response;
  }

  const deleteAccess = await validateUserDeleteAccess(session.session, session.actingUserId, idResolution.id);
  if (!deleteAccess.ok) {
    return deleteAccess.response;
  }

  try {
    const deletedUser = await deleteUserById(idResolution.id);
    await logAudit(
      'AUDIT',
      `User '${deletedUser.name}' (ID: ${idResolution.id}) was deleted.`,
      'API:Users:Delete',
      session.actingUserId,
      { targetUserId: idResolution.id }
    );

    return NextResponse.json({ message: 'User deleted successfully' }, { status: 200 });
  } catch (error: unknown) {
    const errorMessage = getErrorMessage(error);
    console.error(`Failed to delete user ${idResolution.id}:`, error);
    await logAudit(
      'ERROR',
      `Failed to delete user (ID: ${idResolution.id}). Error: ${errorMessage}`,
      'API:Users:Delete',
      session.actingUserId,
      { targetUserId: idResolution.id }
    );

    if (getErrorCode(error) === 'P2025') {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Error deleting user', error: errorMessage }, { status: 500 });
  }
}
