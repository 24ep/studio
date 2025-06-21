// src/app/api/settings/user-groups/[id]/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import type { UserGroup, PlatformModuleId } from '@/lib/types';
import { PLATFORM_MODULES } from '@/lib/types';
import { logAudit } from '@/lib/auditLog';

const platformModuleIds = PLATFORM_MODULES.map(m => m.id) as [PlatformModuleId, ...PlatformModuleId[]];

const updateGroupFormSchema = z.object({
  name: z.string().min(1, "Group name is required").max(100),
  description: z.string().optional().nullable(),
  permissions: z.array(z.enum(platformModuleIds)).optional(),
  is_default: z.boolean().optional(),
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
  if (session?.user?.role !== 'Admin' && !session?.user?.modulePermissions?.includes('USER_GROUPS_MANAGE')) {
     await logAudit('WARN', `Forbidden attempt to update user group (ID: ${params.id}) by user ${session?.user?.email || 'Unknown'}.`, 'API:UserGroups:Update', session?.user?.id, { targetGroupId: params.id });
    return NextResponse.json({ message: "Forbidden: Insufficient permissions" }, { status: 403 });
  }

  let body;
  try {
    body = await request.json();
  } catch (error) {
    return NextResponse.json({ message: "Error parsing request body", error: (error as Error).message }, { status: 400 });
  }

  const validationResult = updateGroupFormSchema.safeParse(body);
  if (!validationResult.success) {
    return NextResponse.json(
      { message: "Invalid input", errors: validationResult.error.flatten().fieldErrors },
      { status: 400 }
    );
  }
  
  const { name, description, permissions, is_default } = validationResult.data;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const existingGroupResult = await client.query('SELECT * FROM "UserGroup" WHERE id = $1 FOR UPDATE', [params.id]);
    if (existingGroupResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({ message: "User group (role) not found" }, { status: 404 });
    }
    const existingGroup: UserGroup = existingGroupResult.rows[0];

    if (existingGroup.is_system_role && name !== existingGroup.name) {
        await client.query('ROLLBACK');
        return NextResponse.json({ message: "System role names cannot be changed." }, { status: 400 });
    }
    
    if (name !== existingGroup.name) {
        const nameCheck = await client.query('SELECT id FROM "UserGroup" WHERE name = $1 AND id != $2', [name, params.id]);
        if (nameCheck.rows.length > 0) {
            await client.query('ROLLBACK');
            return NextResponse.json({ message: "Another user group (role) with this name already exists." }, { status: 409 });
        }
    }

    if (is_default === true) {
      await client.query('UPDATE "UserGroup" SET "is_default" = FALSE WHERE "is_default" = TRUE AND id != $1', [params.id]);
    }

    const updateQuery = `
      UPDATE "UserGroup" 
      SET name = $1, description = $2, "is_default" = $3, "updatedAt" = NOW() 
      WHERE id = $4 
      RETURNING *;
    `;
    const groupUpdateResult = await client.query(updateQuery, [name, description, is_default, params.id]);
    
    if (permissions !== undefined) {
        await client.query('DELETE FROM "UserGroup_PlatformModule" WHERE group_id = $1', [params.id]);
        if (permissions.length > 0) {
            const permissionInsertPromises = permissions.map(permissionId =>
                client.query('INSERT INTO "UserGroup_PlatformModule" (group_id, permission_id) VALUES ($1, $2)', [params.id, permissionId])
            );
            await Promise.all(permissionInsertPromises);
        }
    }

    await client.query('COMMIT');
    
    const finalGroupResult = await pool.query('SELECT id, name, description, "is_default", "is_system_role", "createdAt", "updatedAt", (SELECT COUNT(*)::int FROM "User_UserGroup" WHERE "groupId" = $1) as user_count FROM "UserGroup" WHERE id = $1', [params.id]);
    const finalGroup: UserGroup = finalGroupResult.rows[0];
    const finalPermissionsResult = await pool.query('SELECT permission_id FROM "UserGroup_PlatformModule" WHERE group_id = $1', [params.id]);
    finalGroup.permissions = finalPermissionsResult.rows.map(row => row.permission_id as PlatformModuleId);
    
    await logAudit('AUDIT', `User group (Role) '${finalGroup.name}' (ID: ${finalGroup.id}) updated by ${session.user.name}.`, 'API:UserGroups:Update', session.user.id, { targetGroupId: finalGroup.id, changes: Object.keys(validationResult.data) });
    return NextResponse.json(finalGroup, { status: 200 });

  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error(`Failed to update user group (role) ${params.id}:`, error);
     if (error.code === '23505' && error.constraint === 'UserGroup_name_key') {
      await logAudit('WARN', `Attempt to update user group (role) resulting in duplicate name for ID ${params.id} by ${session.user.name}.`, 'API:UserGroups:Update', session.user.id, { targetGroupId: params.id, attemptedName: name });
      return NextResponse.json({ message: "A user group (role) with this name already exists." }, { status: 409 });
    }
    await logAudit('ERROR', `Failed to update user group (role) (ID: ${params.id}) by ${session.user.name}. Error: ${error.message}`, 'API:UserGroups:Update', session.user.id, { targetGroupId: params.id });
    return NextResponse.json({ message: "Error updating user group (role)", error: error.message }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'Admin' && !session?.user?.modulePermissions?.includes('USER_GROUPS_MANAGE')) {
    await logAudit('WARN', `Forbidden attempt to delete user group (ID: ${params.id}) by user ${session?.user?.email || 'Unknown'}.`, 'API:UserGroups:Delete', session?.user?.id, { targetGroupId: params.id });
    return NextResponse.json({ message: "Forbidden: Insufficient permissions" }, { status: 403 });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const groupResult = await client.query('SELECT name, is_system_role FROM "UserGroup" WHERE id = $1 FOR UPDATE', [params.id]);
    if (groupResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({ message: "User group (role) not found" }, { status: 404 });
    }
    const { name: groupName, is_system_role: isSystemRole } = groupResult.rows[0];

    if (isSystemRole) {
      await client.query('ROLLBACK');
      return NextResponse.json({ message: "System roles cannot be deleted." }, { status: 400 });
    }

    await client.query('DELETE FROM "User_UserGroup" WHERE "groupId" = $1', [params.id]);
    await client.query('DELETE FROM "UserGroup_PlatformModule" WHERE group_id = $1', [params.id]);
    const deleteResult = await client.query('DELETE FROM "UserGroup" WHERE id = $1', [params.id]);
    
    if (deleteResult.rowCount === 0) {
        await client.query('ROLLBACK');
        return NextResponse.json({ message: "User group (role) not found or already deleted during transaction" }, { status: 404 });
    }
    await client.query('COMMIT');

    await logAudit('AUDIT', `User group (Role) '${groupName}' (ID: ${params.id}) deleted by ${session.user.name}.`, 'API:UserGroups:Delete', session.user.id, { targetGroupId: params.id, deletedGroupName: groupName });
    return NextResponse.json({ message: "User group (role) deleted successfully" }, { status: 200 });

  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error(`Failed to delete user group (role) ${params.id}:`, error);
    await logAudit('ERROR', `Failed to delete user group (role) (ID: ${params.id}) by ${session.user.name}. Error: ${error.message}`, 'API:UserGroups:Delete', session.user.id, { targetGroupId: params.id });
    return NextResponse.json({ message: "Error deleting user group (role)", error: error.message }, { status: 500 });
  } finally {
    client.release();
  }
}
