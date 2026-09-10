import { type NextRequest } from 'next/server';
import { handleDeleteUserGroup, handleGetUserGroup, handleUpdateUserGroup } from './user-group-detail-handlers';
import type { UserGroupDetailRouteContext } from './user-group-detail-schema';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * @openapi
 * /api/settings/user-groups/{id}:
 *   get:
 *     summary: Get a user group by ID
 *   put:
 *     summary: Update a user group by ID
 *   delete:
 *     summary: Delete a user group by ID
 */
export function GET(request: NextRequest, context: UserGroupDetailRouteContext) {
  return handleGetUserGroup(request, context);
}

export function PUT(request: NextRequest, context: UserGroupDetailRouteContext) {
  return handleUpdateUserGroup(request, context);
}

export function DELETE(request: NextRequest, context: UserGroupDetailRouteContext) {
  return handleDeleteUserGroup(request, context);
}
