export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { type NextRequest } from 'next/server';
import {
  handleAddTeamMember,
  handleGetTeamMembers,
  handleRemoveTeamMember,
} from './user-team-members-handlers';
import type { UserTeamMembersRouteContext } from './user-team-members-schema';

/**
 * @openapi
 * /api/settings/user-teams/{id}/members:
 *   get:
 *     summary: Get team members
 *   post:
 *     summary: Add user to team
 *   delete:
 *     summary: Remove user from team
 */
export function GET(request: NextRequest, context: UserTeamMembersRouteContext) {
  return handleGetTeamMembers(request, context);
}

export function POST(request: NextRequest, context: UserTeamMembersRouteContext) {
  return handleAddTeamMember(request, context);
}

export function DELETE(request: NextRequest, context: UserTeamMembersRouteContext) {
  return handleRemoveTeamMember(request, context);
}
