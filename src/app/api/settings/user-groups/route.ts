export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { type NextRequest } from 'next/server';
import { handleCreateUserGroup, handleGetUserGroups } from './user-groups-handlers';

/**
 * @openapi
 * /api/settings/user-groups:
 *   get:
 *     summary: Get all user groups
 *     description: Returns all user groups. Requires authentication.
 *     responses:
 *       200:
 *         description: List of user groups
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 *   post:
 *     summary: Create a new user group
 *     description: Creates a new user group. Requires authentication and Admin or USER_GROUPS_MANAGE permission.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: string
 *           examples:
 *             example:
 *               summary: Example request
 *               value:
 *                 name: "Recruiter"
 *                 description: "Group for all recruiters"
 *                 permissions: ["applicantS_VIEW", "applicantS_MANAGE"]
 *     responses:
 *       201:
 *         description: User group created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *             examples:
 *               success:
 *                 summary: Example response
 *                 value:
 *                   id: "uuid"
 *                   name: "Recruiter"
 *                   description: "Group for all recruiters"
 *                   permissions: ["applicantS_VIEW", "applicantS_MANAGE"]
 *                   is_default: false
 *                   is_system_role: false
 *                   user_count: 1
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: "Forbidden: Insufficient permissions"
 */
export function GET(request: NextRequest) {
  return handleGetUserGroups(request);
}

export function POST(request: NextRequest) {
  return handleCreateUserGroup(request);
}

