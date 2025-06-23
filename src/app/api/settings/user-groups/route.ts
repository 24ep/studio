// src/app/api/settings/user-groups/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { getPool } from '@/lib/db';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { logAudit } from '@/lib/auditLog';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export const dynamic = "force-dynamic";

const userGroupSchema = z.object({
  name: z.string().min(1, 'Group name cannot be empty.'),
  description: z.string().optional().nullable(),
  permissions: z.array(z.string()).optional(),
});

/**
 * @openapi
 * /api/settings/user-groups:
 *   get:
 *     summary: Get all user groups
 *     description: Returns a list of all user groups. Requires authentication and Admin or USER_GROUPS_MANAGE permission.
 *     responses:
 *       200:
 *         description: List of user groups
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *             examples:
 *               success:
 *                 summary: Example response
 *                 value:
 *                   - id: "uuid"
 *                     name: "Recruiters"
 *                     description: "Group for all recruiters"
 *                     permissions: ["CANDIDATES_VIEW", "CANDIDATES_MANAGE"]
 *                     is_default: false
 *                     is_system_role: false
 *                     user_count: 5
 *       401:
 *         description: Unauthorized
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
 *                 name: "Recruiters"
 *                 description: "Group for all recruiters"
 *                 permissions: ["CANDIDATES_VIEW", "CANDIDATES_MANAGE"]
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
 *                   name: "Recruiters"
 *                   description: "Group for all recruiters"
 *                   permissions: ["CANDIDATES_VIEW", "CANDIDATES_MANAGE"]
 *                   is_default: false
 *                   is_system_role: false
 *                   user_count: 1
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: "Forbidden: Insufficient permissions"
 */
export async function GET(request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return new NextResponse('Unauthorized', { status: 401 });

    const client = await getPool().connect();
    try {
        const result = await client.query(`
            SELECT 
                ug.id, 
                ug.name, 
                ug.description, 
                ug.permissions,
                ug."is_default", 
                ug."is_system_role",
                ug."createdAt", 
                ug."updatedAt",
                COUNT(uug."userId")::int as user_count
            FROM "UserGroup" ug
            LEFT JOIN "User_UserGroup" uug ON ug.id = uug."groupId"
            GROUP BY ug.id, ug.name, ug.description, ug.permissions, ug."is_default", ug."is_system_role", ug."createdAt", ug."updatedAt"
            ORDER BY ug.name ASC
        `);
        return NextResponse.json(result.rows);
    } catch (error: any) {
        console.error("Failed to fetch user groups:", error);
        return NextResponse.json({ message: "Error fetching user groups", error: error.message }, { status: 500 });
    } finally {
        client.release();
    }
}

export async function POST(request: NextRequest) {
    const session = await getServerSession(authOptions);
    const actingUserId = session?.user?.id;
    if (!actingUserId) return new NextResponse('Unauthorized', { status: 401 });

    let body;
    try {
        body = await request.json();
    } catch (e) {
        return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 });
    }
    
    const validation = userGroupSchema.safeParse(body);
    if (!validation.success) {
        return NextResponse.json({ message: 'Invalid input', errors: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { name, description, permissions } = validation.data;
    const newId = uuidv4();
    
    const client = await getPool().connect();
    try {
        const result = await client.query(
            'INSERT INTO "UserGroup" (id, name, description, permissions) VALUES ($1, $2, $3, $4) RETURNING *',
            [newId, name, description, permissions ?? []]
        );
        await logAudit('AUDIT', `User group '${name}' created.`, 'API:UserGroups:Create', actingUserId, { groupId: newId });
        return NextResponse.json(result.rows[0], { status: 201 });
    } catch (error: any) {
        console.error("Failed to create user group:", error);
        await logAudit('ERROR', `Failed to create group '${name}'. Error: ${error.message}`, 'API:UserGroups:Create', actingUserId, { input: body });
        return NextResponse.json({ message: "Error creating user group", error: error.message }, { status: 500 });
    } finally {
        client.release();
    }
}
