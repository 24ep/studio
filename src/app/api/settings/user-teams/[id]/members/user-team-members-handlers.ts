import { NextResponse, type NextRequest } from 'next/server';
import { logAudit } from '@/lib/auditLog';
import { requireUserTeamPermission, requireUserTeamSession } from '../user-team-detail-auth';
import {
  addUserToTeam,
  connectUserTeamMembersClient,
  fetchTeamMembers,
  fetchUser,
  fetchUserTeam,
  releaseUserTeamMembersClient,
  removeUserFromTeam,
  userBelongsToTeam,
} from './user-team-members-data';
import {
  parseAddTeamMemberBody,
  parseRemoveTeamMemberQuery,
  resolveTeamId,
} from './user-team-members-request';
import type { UserTeamMembersRouteContext } from './user-team-members-schema';

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export async function handleGetTeamMembers(request: NextRequest, context: UserTeamMembersRouteContext) {
  const session = await requireUserTeamSession();
  if (!session.ok) {
    return session.response;
  }

  const permissionError = requireUserTeamPermission(session.session, 'USERS_VIEW');
  if (permissionError) {
    return permissionError;
  }

  const teamId = await resolveTeamId(context);
  const client = await connectUserTeamMembersClient();

  try {
    const team = await fetchUserTeam(client, teamId);
    if (!team) {
      return new NextResponse('Team not found', { status: 404 });
    }

    const users = await fetchTeamMembers(client, teamId);
    return NextResponse.json({ users });
  } catch (error: unknown) {
    const errorMessage = getErrorMessage(error);
    console.error('Failed to fetch team members:', error);
    return NextResponse.json({ message: 'Error fetching team members', error: errorMessage }, { status: 500 });
  } finally {
    releaseUserTeamMembersClient(client);
  }
}

export async function handleAddTeamMember(request: NextRequest, context: UserTeamMembersRouteContext) {
  const session = await requireUserTeamSession();
  if (!session.ok) {
    return session.response;
  }

  const permissionError = requireUserTeamPermission(session.session, 'USERS_EDIT');
  if (permissionError) {
    return permissionError;
  }

  const teamId = await resolveTeamId(context);
  const parsedBody = await parseAddTeamMemberBody(request);
  if (!parsedBody.ok) {
    return parsedBody.response;
  }

  const { userId } = parsedBody.input;
  const client = await connectUserTeamMembersClient();

  try {
    const team = await fetchUserTeam(client, teamId);
    if (!team) {
      return new NextResponse('Team not found', { status: 404 });
    }

    const user = await fetchUser(client, userId);
    if (!user) {
      return new NextResponse('User not found', { status: 404 });
    }

    if (await userBelongsToTeam(client, userId, teamId)) {
      return new NextResponse('User is already a member of this team', { status: 409 });
    }

    await addUserToTeam(client, teamId, userId);
    await logAudit(
      'AUDIT',
      `User '${user.name}' added to team '${team.name}'.`,
      'API:UserTeams:AddMember',
      session.actingUserId,
      { teamId, userId },
    );

    return NextResponse.json({ message: 'User added to team successfully' });
  } catch (error: unknown) {
    const errorMessage = getErrorMessage(error);
    console.error('Failed to add user to team:', error);
    await logAudit(
      'ERROR',
      `Failed to add user to team. Error: ${errorMessage}`,
      'API:UserTeams:AddMember',
      session.actingUserId,
      { teamId, userId },
    );
    return NextResponse.json({ message: 'Error adding user to team', error: errorMessage }, { status: 500 });
  } finally {
    releaseUserTeamMembersClient(client);
  }
}

export async function handleRemoveTeamMember(request: NextRequest, context: UserTeamMembersRouteContext) {
  const session = await requireUserTeamSession();
  if (!session.ok) {
    return session.response;
  }

  const permissionError = requireUserTeamPermission(session.session, 'USERS_EDIT');
  if (permissionError) {
    return permissionError;
  }

  const teamId = await resolveTeamId(context);
  const parsedQuery = parseRemoveTeamMemberQuery(request);
  if (!parsedQuery.ok) {
    return parsedQuery.response;
  }

  const { userId } = parsedQuery;
  const client = await connectUserTeamMembersClient();

  try {
    const team = await fetchUserTeam(client, teamId);
    if (!team) {
      return new NextResponse('Team not found', { status: 404 });
    }

    const user = await fetchUser(client, userId);
    if (!user) {
      return new NextResponse('User not found', { status: 404 });
    }

    if (!(await userBelongsToTeam(client, userId, teamId))) {
      return new NextResponse('User is not a member of this team', { status: 404 });
    }

    await removeUserFromTeam(client, userId);
    await logAudit(
      'AUDIT',
      `User '${user.name}' removed from team '${team.name}'.`,
      'API:UserTeams:RemoveMember',
      session.actingUserId,
      { teamId, userId },
    );

    return NextResponse.json({ message: 'User removed from team successfully' });
  } catch (error: unknown) {
    const errorMessage = getErrorMessage(error);
    console.error('Failed to remove user from team:', error);
    await logAudit(
      'ERROR',
      `Failed to remove user from team. Error: ${errorMessage}`,
      'API:UserTeams:RemoveMember',
      session.actingUserId,
      { teamId, userId },
    );
    return NextResponse.json({ message: 'Error removing user from team', error: errorMessage }, { status: 500 });
  } finally {
    releaseUserTeamMembersClient(client);
  }
}
