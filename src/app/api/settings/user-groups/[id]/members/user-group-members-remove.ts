import { NextResponse, type NextRequest } from 'next/server';
import { logAudit } from '@/lib/auditLog';
import { getPool } from '@/lib/db';
import {
  requireUserGroupMembersPermission,
  requireUserGroupMembersSession,
} from './user-group-members-auth';
import {
  fetchUser,
  fetchUserGroup,
  removeUserFromGroup,
  userBelongsToGroup,
} from './user-group-members-data';
import { sanitizeLogValue } from './user-group-members-log';
import {
  extractGroupIdFromRequest,
  parseRemoveMemberQuery,
  resolveGroupId,
} from './user-group-members-request';
import type { UserGroupMembersRouteContext } from './user-group-members-schema';

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export async function handleRemoveGroupMember(request: NextRequest, context?: UserGroupMembersRouteContext) {
  const groupIdForAudit = await extractGroupIdFromRequest(request, context);
  const parsedQuery = parseRemoveMemberQuery(request);
  const userIdForAudit = parsedQuery.ok ? parsedQuery.input.userId : request.nextUrl.searchParams.get('userId');
  const session = await requireUserGroupMembersSession();
  if (!session.ok) {
    return session.response;
  }

  const permissionError = await requireUserGroupMembersPermission(
    session.session,
    'USER_GROUPS_EDIT',
    'API:UserGroups:RemoveMember',
    `Forbidden attempt to remove user from group (Group ID: ${groupIdForAudit})`,
    { targetGroupId: groupIdForAudit, targetUserId: userIdForAudit }
  );
  if (permissionError) {
    return permissionError;
  }

  const groupIdResolution = await resolveGroupId(request, context);
  if (!groupIdResolution.ok) {
    return groupIdResolution.response;
  }

  if (!parsedQuery.ok) {
    return parsedQuery.response;
  }

  const { userId } = parsedQuery.input;
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
    if (!alreadyInGroup) {
      return NextResponse.json({ message: 'User is not a member of this group' }, { status: 404 });
    }

    await removeUserFromGroup(client, userId);
    await logAudit(
      'AUDIT',
      `User '${user.name}' removed from group '${group.name}' by ${session.session.user.name}.`,
      'API:UserGroups:RemoveMember',
      session.session.user.id,
      { targetGroupId: groupIdResolution.groupId, targetUserId: userId }
    );

    return NextResponse.json({
      message: 'User removed from group successfully',
      user,
    }, { status: 200 });
  } catch (error) {
    const sanitizedUserId = sanitizeLogValue(userId);
    const sanitizedGroupId = sanitizeLogValue(groupIdResolution.groupId);
    const errorMessage = getErrorMessage(error);
    console.error(`Failed to remove user ${sanitizedUserId} from group ${sanitizedGroupId}:`, error);
    await logAudit(
      'ERROR',
      `Failed to remove user from group (Group ID: ${sanitizedGroupId}, User ID: ${sanitizedUserId}) by ${session.session.user.name}. Error: ${errorMessage}`,
      'API:UserGroups:RemoveMember',
      session.session.user.id,
      { targetGroupId: groupIdResolution.groupId, targetUserId: userId }
    );
    return NextResponse.json({ message: 'Error removing user from group', error: errorMessage }, { status: 500 });
  } finally {
    client.release();
  }
}
