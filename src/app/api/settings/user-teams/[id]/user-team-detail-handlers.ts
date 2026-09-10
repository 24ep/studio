import { NextResponse, type NextRequest } from 'next/server';
import { logAudit } from '@/lib/auditLog';
import { requireUserTeamPermission, requireUserTeamSession } from './user-team-detail-auth';
import { deleteUserTeam, fetchUserTeamDetail, updateUserTeam } from './user-team-detail-data';
import { parseUserTeamUpdateBody, resolveUserTeamId } from './user-team-detail-request';
import type { UserTeamDetailRouteContext } from './user-team-detail-schema';

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export async function handleGetUserTeam(request: NextRequest, context?: UserTeamDetailRouteContext) {
  const idResolution = await resolveUserTeamId(request, context);
  if (!idResolution.ok) {
    return idResolution.response;
  }

  const session = await requireUserTeamSession();
  if (!session.ok) {
    return session.response;
  }

  try {
    const team = await fetchUserTeamDetail(idResolution.id);
    if (!team) {
      return new NextResponse('Team not found', { status: 404 });
    }

    return NextResponse.json(team);
  } catch (error: unknown) {
    const errorMessage = getErrorMessage(error);
    console.error('Failed to fetch user team:', error);
    return NextResponse.json({ message: 'Error fetching user team', error: errorMessage }, { status: 500 });
  }
}

export async function handleUpdateUserTeam(request: NextRequest, context?: UserTeamDetailRouteContext) {
  const idResolution = await resolveUserTeamId(request, context);
  if (!idResolution.ok) {
    return idResolution.response;
  }

  const session = await requireUserTeamSession();
  if (!session.ok) {
    return session.response;
  }

  const permissionError = requireUserTeamPermission(session.session, 'USERS_EDIT');
  if (permissionError) {
    return permissionError;
  }

  const parsedBody = await parseUserTeamUpdateBody(request);
  if (!parsedBody.ok) {
    return parsedBody.response;
  }

  try {
    const updatedTeam = await updateUserTeam(idResolution.id, parsedBody.data);
    if (!updatedTeam) {
      return new NextResponse('Team not found', { status: 404 });
    }

    await logAudit(
      'AUDIT',
      `User team '${parsedBody.data.name}' updated.`,
      'API:UserTeams:Update',
      session.actingUserId,
      { teamId: idResolution.id }
    );
    return NextResponse.json(updatedTeam);
  } catch (error: unknown) {
    const errorMessage = getErrorMessage(error);
    console.error('Failed to update user team:', error);
    await logAudit(
      'ERROR',
      `Failed to update team '${parsedBody.data.name}'. Error: ${errorMessage}`,
      'API:UserTeams:Update',
      session.actingUserId,
      { teamId: idResolution.id, input: parsedBody.body }
    );
    return NextResponse.json({ message: 'Error updating user team', error: errorMessage }, { status: 500 });
  }
}

export async function handleDeleteUserTeam(request: NextRequest, context?: UserTeamDetailRouteContext) {
  const idResolution = await resolveUserTeamId(request, context);
  if (!idResolution.ok) {
    return idResolution.response;
  }

  const session = await requireUserTeamSession();
  if (!session.ok) {
    return session.response;
  }

  const permissionError = requireUserTeamPermission(session.session, 'USERS_DELETE');
  if (permissionError) {
    return permissionError;
  }

  try {
    const deletedTeam = await deleteUserTeam(idResolution.id);
    if (!deletedTeam) {
      return new NextResponse('Team not found', { status: 404 });
    }

    await logAudit(
      'AUDIT',
      `User team '${deletedTeam.name}' deleted.`,
      'API:UserTeams:Delete',
      session.actingUserId,
      { teamId: idResolution.id }
    );
    return new NextResponse('Team deleted successfully', { status: 200 });
  } catch (error: unknown) {
    const errorMessage = getErrorMessage(error);
    console.error('Failed to delete user team:', error);
    await logAudit(
      'ERROR',
      `Failed to delete team. Error: ${errorMessage}`,
      'API:UserTeams:Delete',
      session.actingUserId,
      { teamId: idResolution.id }
    );
    return NextResponse.json({ message: 'Error deleting user team', error: errorMessage }, { status: 500 });
  }
}
