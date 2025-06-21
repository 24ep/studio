// src/app/api/settings/user-groups/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import type { UserGroup, PlatformModuleId } from '@/lib/types';
import { PLATFORM_MODULES } from '@/lib/types';
import { logAudit } from '@/lib/auditLog';

const platformModuleIds = PLATFORM_MODULES.map(m => m.id) as [PlatformModuleId, ...PlatformModuleId[]];

const groupFormSchema = z.object({
  name: z.string().min(1, "Group name is required").max(100),
  description: z.string().optional().nullable(),
  permissions: z.array(z.enum(platformModuleIds)).optional().default([]),
  is_default: z.boolean().optional().default(false),
});

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'Admin' && !session?.user?.modulePermissions?.includes('USER_GROUPS_MANAGE')) {
    await logAudit('WARN', `Forbidden attempt to GET user groups by user ${session?.user?.email || 'Unknown'}.`, 'API:UserGroups:Get', session?.user?.id);
    return NextResponse.json({ message: "Forbidden: Insufficient permissions" }, { status: 403 });
  }

  try {
    const result = await pool.query(`
      SELECT 
        ug.id, 
        ug.name, 
        ug.description, 
        ug."is_default", 
        ug."is_system_role",
        ug."createdAt", 
        ug."updatedAt",
        COUNT(uug."userId")::int as user_count,
        COALESCE(json_agg(DISTINCT ugpm.permission_id) FILTER (WHERE ugpm.permission_id IS NOT NULL), '[]'::json) as permissions
      FROM "UserGroup" ug
      LEFT JOIN "User_UserGroup" uug ON ug.id = uug."groupId"
      LEFT JOIN "UserGroup_PlatformModule" ugpm ON ug.id = ugpm.group_id
      GROUP BY ug.id, ug.name, ug.description, ug."is_default", ug."is_system_role", ug."createdAt", ug."updatedAt"
      ORDER BY ug.name ASC
    `);
    return NextResponse.json(result.rows, { status: 200 });
  } catch (error: any) {
    console.error("Failed to fetch user groups:", error);
    await logAudit('ERROR', `Failed to fetch user groups by ${session?.user?.name}. Error: ${error.message}. Code: ${error.code}, Constraint: ${error.constraint}`, 'API:UserGroups:Get', session?.user?.id, {errorCode: error.code, errorConstraint: error.constraint});
    return NextResponse.json({ message: "Error fetching user groups", error: error.message, code: error.code }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'Admin' && !session?.user?.modulePermissions?.includes('USER_GROUPS_MANAGE')) {
    await logAudit('WARN', `Forbidden attempt to create user group by user ${session?.user?.email || 'Unknown'}.`, 'API:UserGroups:Create', session?.user?.id);
    return NextResponse.json({ message: "Forbidden: Insufficient permissions" }, { status: 403 });
  }

  let body;
  try {
    body = await request.json();
  } catch (error) {
    return NextResponse.json({ message: "Error parsing request body", error: (error as Error).message }, { status: 400 });
  }

  const validationResult = groupFormSchema.safeParse(body);
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

    if (is_default) {
      await client.query('UPDATE "UserGroup" SET "is_default" = FALSE WHERE "is_default" = TRUE');
    }

    const newGroupId = uuidv4();
    const insertQuery = `
      INSERT INTO "UserGroup" (id, name, description, "is_default", "is_system_role", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, FALSE, NOW(), NOW())
      RETURNING *;
    `;
    const groupResult = await client.query(insertQuery, [newGroupId, name, description, is_default]);
    const newGroup = groupResult.rows[0];

    if (permissions && permissions.length > 0) {
        const permissionInsertPromises = permissions.map(permissionId =>
            client.query('INSERT INTO "UserGroup_PlatformModule" (group_id, permission_id) VALUES ($1, $2)', [newGroupId, permissionId])
        );
        await Promise.all(permissionInsertPromises);
    }
    
    await client.query('COMMIT');

    const finalGroup = { ...newGroup, permissions: permissions || [], user_count: 0 };

    await logAudit('AUDIT', `User group (Role) '${finalGroup.name}' (ID: ${finalGroup.id}) created by ${session.user.name}.`, 'API:UserGroups:Create', session.user.id, { groupId: finalGroup.id, groupName: finalGroup.name });
    return NextResponse.json(finalGroup, { status: 201 });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error("Failed to create user group (role):", error);
    if (error.code === '23505' && error.constraint === 'UserGroup_name_key') {
      await logAudit('WARN', `Attempt to create user group (role) with duplicate name '${name}' by ${session.user.name}.`, 'API:UserGroups:Create', session.user.id, { groupName: name });
      return NextResponse.json({ message: `A user group (role) with the name "${name}" already exists.` }, { status: 409 });
    }
    await logAudit('ERROR', `Failed to create user group (role) '${name}' by ${session.user.name}. Error: ${error.message}`, 'API:UserGroups:Create', session.user.id, { groupName: name });
    return NextResponse.json({ message: "Error creating user group (role)", error: error.message }, { status: 500 });
  } finally {
    client.release();
  }
}
