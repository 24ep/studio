import { type NextRequest } from 'next/server';
import { handleDeleteUserTeam, handleGetUserTeam, handleUpdateUserTeam } from './user-team-detail-handlers';
import type { UserTeamDetailRouteContext } from './user-team-detail-schema';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * @openapi
 * /api/settings/user-teams/{id}:
 *   get:
 *     summary: Get a specific user team
 *   put:
 *     summary: Update a user team
 *   delete:
 *     summary: Delete a user team
 */
export function GET(request: NextRequest, context: UserTeamDetailRouteContext) {
  return handleGetUserTeam(request, context);
}

export function PUT(request: NextRequest, context: UserTeamDetailRouteContext) {
  return handleUpdateUserTeam(request, context);
}

export function DELETE(request: NextRequest, context: UserTeamDetailRouteContext) {
  return handleDeleteUserTeam(request, context);
}
