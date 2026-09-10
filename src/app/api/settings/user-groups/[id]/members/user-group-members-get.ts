import { NextResponse, type NextRequest } from 'next/server';
import { logAudit } from '@/lib/auditLog';
import { getPool } from '@/lib/db';
import {
  requireUserGroupMembersPermission,
  requireUserGroupMembersSession,
} from './user-group-members-auth';
import { fetchGroupMembers, fetchUserGroup } from './user-group-members-data';
import { extractGroupIdFromRequest, resolveGroupId } from './user-group-members-request';
import type { UserGroupMembersRouteContext } from './user-group-members-schema';

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export async function handleGetGroupMembers(request: NextRequest, context?: UserGroupMembersRouteContext) {
  const groupIdForAudit = await extractGroupIdFromRequest(request, context);
  const session = await requireUserGroupMembersSession();
  if (!session.ok) {
    return session.response;
  }

  const permissionError = await requireUserGroupMembersPermission(
    session.session,
    'USER_GROUPS_VIEW',
    'API:UserGroups:GetMembers',
    `Forbidden attempt to GET group members (Group ID: ${groupIdForAudit})`,
    { targetGroupId: groupIdForAudit }
  );
  if (permissionError) {
    return permissionError;
  }

  const groupIdResolution = await resolveGroupId(request, context);
  if (!groupIdResolution.ok) {
    return groupIdResolution.response;
  }

  const client = await getPool().connect();
  try {
    const group = await fetchUserGroup(client, groupIdResolution.groupId);
    if (!group) {
      return NextResponse.json({ message: 'User group not found' }, { status: 404 });
    }

    const users = await fetchGroupMembers(client, groupIdResolution.groupId);
    return NextResponse.json({ users, group }, { status: 200 });
  } catch (error: unknown) {
    const errorMessage = getErrorMessage(error);
    console.error(`Failed to fetch group members for group ${groupIdResolution.groupId}:`, error);
    await logAudit(
      'ERROR',
      `Failed to fetch group members (Group ID: ${groupIdResolution.groupId}) by ${session.session.user.name}. Error: ${errorMessage}`,
      'API:UserGroups:GetMembers',
      session.session.user.id,
      { targetGroupId: groupIdResolution.groupId }
    );
    return NextResponse.json({ message: 'Error fetching group members', error: errorMessage }, { status: 500 });
  } finally {
    client.release();
  }
}
