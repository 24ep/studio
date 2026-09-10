import { type NextRequest } from 'next/server';
import { handleDeleteUser, handleGetUserDetail, handleUpdateUser } from './user-detail-handlers';
import { type UserDetailRouteContext } from './user-detail-schema';

export const dynamic = 'force-dynamic';

/**
 * @openapi
 * /api/users/{id}:
 *   get:
 *     summary: Get a user by ID
 *   put:
 *     summary: Update a user by ID
 *   delete:
 *     summary: Delete a user by ID
 */
export function GET(request: NextRequest, context: UserDetailRouteContext) {
  return handleGetUserDetail(request, context);
}

export function PUT(request: NextRequest, context: UserDetailRouteContext) {
  return handleUpdateUser(request, context);
}

export function DELETE(request: NextRequest, context: UserDetailRouteContext) {
  return handleDeleteUser(request, context);
}
