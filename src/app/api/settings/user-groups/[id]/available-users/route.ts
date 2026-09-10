import { auth } from '@/auth';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// src/app/api/settings/user-groups/[id]/available-users/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { hasPermission } from '@/lib/permissions';
import { logAudit } from '@/lib/auditLog';
import { getPool } from '@/lib/db';

function extractGroupIdFromUrl(request: NextRequest): string | null {
  const match = request.nextUrl.pathname.match(/\/user-groups\/([^/]+)\/available-users/);
  return match ? match[1] : null;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * @openapi
 * /api/settings/user-groups/{id}/available-users:
 *   get:
 *     summary: Get available users for a group
 *     description: Returns all users that are not currently members of the specified user group. Requires Admin or USER_GROUPS_MANAGE permission.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the user group
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term to filter users by name or email
 *     responses:
 *       200:
 *         description: List of available users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       email:
 *                         type: string
 *                       role:
 *                         type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (insufficient permissions)
 *       404:
 *         description: Group not found
 *       500:
 *         description: Server error
 */
export async function GET(request: NextRequest) {
  const groupId = extractGroupIdFromUrl(request);
  const { searchParams } = new URL(request.url);
  const searchTerm = searchParams.get('search');
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (!hasPermission(session.user, 'USER_GROUPS_VIEW')) {
    await logAudit('WARN', `Forbidden attempt to GET available users for group (Group ID: ${groupId}) by user ${session.user.email}.`, 'API:UserGroups:GetAvailableUsers', session.user.id, { targetGroupId: groupId });
    return NextResponse.json({ message: "Forbidden: Insufficient permissions" }, { status: 403 });
  }

  if (!groupId) {
    return NextResponse.json({ message: "Invalid group ID" }, { status: 400 });
  }

  const client = await getPool().connect();
  try {
    // First check if the group exists
    const groupCheck = await client.query('SELECT id, name FROM "UserGroup" WHERE id = $1', [groupId]);
    if (groupCheck.rows.length === 0) {
      return NextResponse.json({ message: "User group not found" }, { status: 404 });
    }

    // Get users not currently in this group using direct foreign key
    const result = await client.query(`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.role,
                    u."avatarUrl",
        u."personal_color",
                    u."createdAt"
      FROM "User" u
      WHERE u."userGroupId" IS NULL OR u."userGroupId" != $1
      ORDER BY u.name ASC
    `, [groupId]);

    return NextResponse.json({ 
      users: result.rows,
      group: {
        id: groupCheck.rows[0].id,
        name: groupCheck.rows[0].name
      }
    }, { status: 200 });

  } catch (error) {
    console.error(`Failed to fetch available users for group ${groupId}:`, error);
    const errorMessage = getErrorMessage(error);
    await logAudit('ERROR', `Failed to fetch available users (Group ID: ${groupId}) by ${session.user.name}. Error: ${errorMessage}`, 'API:UserGroups:GetAvailableUsers', session.user.id, { targetGroupId: groupId });
    return NextResponse.json({ message: "Error fetching available users", error: errorMessage }, { status: 500 });
  } finally {
    client.release();
  }
}
