import { NextResponse, type NextRequest } from 'next/server';
import { logAudit } from '@/lib/auditLog';
import { getPool } from '@/lib/db';
import {
  requireUserGroupMembersPermission,
  requireUserGroupMembersSession,
} from './user-group-members-auth';
import {
  addUserToGroup,
  fetchUser,
  fetchUserGroup,
  userBelongsToGroup,
} from './user-group-members-data';
import { sanitizeLogValue } from './user-group-members-log';
import {
  extractGroupIdFromRequest,
  parseAddMemberBody,
  resolveGroupId,
} from './user-group-members-request';
import type { UserGroupMembersRouteContext } from './user-group-members-schema';

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export async function handleAddGroupMember(request: NextRequest, context?: UserGroupMembersRouteContext) {
  const groupIdForAudit = await extractGroupIdFromRequest(request, context);
  const session = await requireUserGroupMembersSession();
  if (!session.ok) {
    return session.response;
  }

  const permissionError = await requireUserGroupMembersPermission(
    session.session,
    'USER_GROUPS_EDIT',
    'API:UserGroups:AddMember',
    `Forbidden attempt to add user to group (Group ID: ${groupIdForAudit})`,
    { targetGroupId: groupIdForAudit }
  );
  if (permissionError) {
    return permissionError;
  }

  const groupIdResolution = await resolveGroupId(request, context);
  if (!groupIdResolution.ok) {
    return groupIdResolution.response;
  }

  const parsedBody = await parseAddMemberBody(request);
  if (!parsedBody.ok) {
    return parsedBody.response;
  }

  const { userId } = parsedBody.input;
  const client = await getPool().connect();

  try {
    const group = await fetchUserGroup(client, groupIdResolution.groupId);
    if (!group) {
      return NextResponse.json({ message: 'User group not found' }, { status: 404 });
    }

    const user = await fetchUser(client, userId);
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const alreadyInGroup = await userBelongsToGroup(client, userId, groupIdResolution.groupId);
    if (alreadyInGroup) {
      return NextResponse.json({ message: 'User is already a member of this group' }, { status: 409 });
    }

    await addUserToGroup(client, groupIdResolution.groupId, userId);
    await logAudit(
      'AUDIT',
      `User '${user.name}' added to group '${group.name}' by ${session.session.user.name}.`,
      'API:UserGroups:AddMember',
      session.session.user.id,
      { targetGroupId: groupIdResolution.groupId, targetUserId: userId }
    );

    return NextResponse.json({
      message: 'User added to group successfully',
      user,
    }, { status: 200 });
  } catch (error: unknown) {
    const errorMessage = getErrorMessage(error);
    console.error(`Failed to add user ${sanitizeLogValue(userId)} to group ${sanitizeLogValue(groupIdResolution.groupId)}:`, error);
    await logAudit(
      'ERROR',
      `Failed to add user to group (Group ID: ${groupIdResolution.groupId}, User ID: ${userId}) by ${session.session.user.name}. Error: ${errorMessage}`,
      'API:UserGroups:AddMember',
      session.session.user.id,
      { targetGroupId: groupIdResolution.groupId, targetUserId: userId }
    );
    return NextResponse.json({ message: 'Error adding user to group', error: errorMessage }, { status: 500 });
  } finally {
    client.release();
  }
}
