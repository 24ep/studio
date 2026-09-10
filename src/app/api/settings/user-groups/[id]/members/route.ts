import { type NextRequest } from 'next/server';
import {
  handleAddGroupMember,
  handleGetGroupMembers,
  handleRemoveGroupMember,
} from './user-group-members-handlers';
import type { UserGroupMembersRouteContext } from './user-group-members-schema';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * @openapi
 * /api/settings/user-groups/{id}/members:
 *   get:
 *     summary: Get users in a specific group
 *   post:
 *     summary: Add a user to a group
 *   delete:
 *     summary: Remove a user from a group
 */
export function GET(request: NextRequest, context: UserGroupMembersRouteContext) {
  return handleGetGroupMembers(request, context);
}

export function POST(request: NextRequest, context: UserGroupMembersRouteContext) {
  return handleAddGroupMember(request, context);
}

export function DELETE(request: NextRequest, context: UserGroupMembersRouteContext) {
  return handleRemoveGroupMember(request, context);
}
