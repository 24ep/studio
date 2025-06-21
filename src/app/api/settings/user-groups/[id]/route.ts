// src/app/api/settings/user-groups/[id]/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import type { UserGroup, PlatformModuleId } from '@/lib/types';
import { PLATFORM_MODULES } from '@/lib/types';
import { logAudit } from '@/lib/auditLog';
import { pool } from '../../../../../lib/db';

const platformModuleIds = PLATFORM_MODULES.map(m => m.id) as [PlatformModuleId, ...PlatformModuleId[]];

const updateGroupFormSchema = z.object({
  name: z.string().min(1, "Group name is required").max(100),
  description: z.string().optional().nullable(),
  permissions: z.array(z.enum(platformModuleIds)).optional(),
  is_default: z.boolean().optional(),
});

const userGroupUpdateSchema = z.object({
  name: z.string().min(1, 'Group name cannot be empty.').optional(),
  description: z.string().optional().nullable(),
  permissions: z.array(z.string()).optional(),
});

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'Admin' && !session?.user?.modulePermissions?.includes('USER_GROUPS_MANAGE')) {
    await logAudit('WARN', `Forbidden attempt to GET user group (ID: ${params.id}) by user ${session?.user?.email || 'Unknown'}.`, 'API:UserGroups:GetById', session?.user?.id, { targetGroupId: params.id });
    return NextResponse.json({ message: "Forbidden: Insufficient permissions" }, { status: 403 });
  }

  try {
    const groupResult = await pool.query(`
      SELECT 
        ug.id, 
        ug.name, 
        ug.description, 
        ug."is_default", 
        ug."is_system_role",
        ug."createdAt", 
        ug."updatedAt",
        COUNT(uug."userId")::int as user_count
      FROM "UserGroup" ug
      LEFT JOIN "User_UserGroup" uug ON ug.id = uug."groupId"
      WHERE ug.id = $1
      GROUP BY ug.id, ug.name, ug.description, ug."is_default", ug."is_system_role", ug."createdAt", ug."updatedAt"
    `, [params.id]);

    if (groupResult.rows.length === 0) {
      return NextResponse.json({ message: "User group (role) not found" }, { status: 404 });
    }
    const group: UserGroup = groupResult.rows[0];

    const permissionsResult = await pool.query('SELECT permission_id FROM "UserGroup_PlatformModule" WHERE group_id = $1', [params.id]);
    group.permissions = permissionsResult.rows.map(row => row.permission_id as PlatformModuleId);

    return NextResponse.json(group, { status: 200 });
  } catch (error) {
    console.error(`Failed to fetch user group (role) ${params.id}:`, error);
    await logAudit('ERROR', `Failed to fetch user group (role) (ID: ${params.id}) by ${session?.user?.name}. Error: ${(error as Error).message}`, 'API:UserGroups:GetById', session?.user?.id, { targetGroupId: params.id });
    return NextResponse.json({ message: "Error fetching user group (role)", error: (error as Error).message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions);
    const actingUserId = session?.user?.id;
    if (!actingUserId) return new NextResponse('Unauthorized', { status: 401 });

    let body;
    try {
        body = await request.json();
    } catch (e) {
        return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 });
    }
    
    const validation = userGroupUpdateSchema.safeParse(body);
    if (!validation.success) {
        return NextResponse.json({ message: 'Invalid input', errors: validation.error.flatten().fieldErrors }, { status: 400 });
    }
    
    const fields = validation.data;
    if (Object.keys(fields).length === 0) {
      return NextResponse.json({ message: "No fields to update provided." }, { status: 400 });
    }

    const setClauses = Object.keys(fields).map((key, index) => `"${key}" = $${index + 1}`);
    const queryParams = Object.values(fields);
    
    const client = await pool.connect();
    try {
        const query = `
            UPDATE "UserGroup" 
            SET ${setClauses.join(', ')}, "updatedAt" = NOW() 
            WHERE id = $${queryParams.length + 1}
            RETURNING *;
        `;
        const result = await client.query(query, [...queryParams, params.id]);

        if (result.rowCount === 0) {
            return NextResponse.json({ message: "User group not found" }, { status: 404 });
        }
        
        await logAudit('AUDIT', `User group '${result.rows[0].name}' updated.`, 'API:UserGroups:Update', actingUserId, { groupId: params.id, changes: fields });
        return NextResponse.json(result.rows[0]);
    } catch (error: any) {
        console.error(`Failed to update user group ${params.id}:`, error);
        await logAudit('ERROR', `Failed to update user group (ID: ${params.id}). Error: ${error.message}`, 'API:UserGroups:Update', actingUserId, { groupId: params.id, input: body });
        return NextResponse.json({ message: "Error updating user group", error: error.message }, { status: 500 });
    } finally {
        client.release();
    }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions);
    const actingUserId = session?.user?.id;
    if (!actingUserId) return new NextResponse('Unauthorized', { status: 401 });
    
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await client.query('DELETE FROM "User_UserGroup" WHERE "groupId" = $1', [params.id]);
        const result = await client.query('DELETE FROM "UserGroup" WHERE id = $1 RETURNING name', [params.id]);
        
        if (result.rowCount === 0) {
            await client.query('ROLLBACK');
            return NextResponse.json({ message: "User group not found" }, { status: 404 });
        }
        
        await client.query('COMMIT');
        
        await logAudit('AUDIT', `User group '${result.rows[0].name}' deleted.`, 'API:UserGroups:Delete', actingUserId, { groupId: params.id });
        return new NextResponse(null, { status: 204 });
    } catch (error: any) {
        await client.query('ROLLBACK');
        console.error(`Failed to delete user group ${params.id}:`, error);
        await logAudit('ERROR', `Failed to delete user group (ID: ${params.id}). Error: ${error.message}`, 'API:UserGroups:Delete', actingUserId, { groupId: params.id });
        return NextResponse.json({ message: "Error deleting user group", error: error.message }, { status: 500 });
    } finally {
        client.release();
    }
}
