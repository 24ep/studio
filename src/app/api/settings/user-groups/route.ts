
// src/app/api/settings/user-groups/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import pool from '../../../../lib/db';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import type { UserGroup } from '@/lib/types';
import { logAudit } from '@/lib/auditLog';

const groupFormSchema = z.object({
  name: z.string().min(1, "Group name is required").max(100),
  description: z.string().optional().nullable(),
});

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'Admin' && !session?.user?.modulePermissions?.includes('USER_GROUPS_MANAGE')) {
    await logAudit('WARN', `Forbidden attempt to GET user groups by user ${session?.user?.email || 'Unknown'}.`, 'API:UserGroups:Get', session?.user?.id);
    return NextResponse.json({ message: "Forbidden: Insufficient permissions" }, { status: 403 });
  }

  try {
    const result = await pool.query('SELECT id, name, description, "createdAt", "updatedAt" FROM "UserGroup" ORDER BY name ASC');
    return NextResponse.json(result.rows, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch user groups:", error);
    await logAudit('ERROR', `Failed to fetch user groups by ${session?.user?.name}. Error: ${(error as Error).message}`, 'API:UserGroups:Get', session?.user?.id);
    return NextResponse.json({ message: "Error fetching user groups", error: (error as Error).message }, { status: 500 });
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

  const { name, description } = validationResult.data;

  try {
    const newGroupId = uuidv4();
    const insertQuery = `
      INSERT INTO "UserGroup" (id, name, description, "createdAt", "updatedAt")
      VALUES ($1, $2, $3, NOW(), NOW())
      RETURNING *;
    `;
    const result = await pool.query(insertQuery, [newGroupId, name, description]);
    const newGroup = result.rows[0];

    await logAudit('AUDIT', `User group '${newGroup.name}' (ID: ${newGroup.id}) created by ${session.user.name}.`, 'API:UserGroups:Create', session.user.id, { groupId: newGroup.id, groupName: newGroup.name });
    return NextResponse.json(newGroup, { status: 201 });
  } catch (error: any) {
    console.error("Failed to create user group:", error);
    if (error.code === '23505' && error.constraint === 'UserGroup_name_key') {
      await logAudit('WARN', `Attempt to create user group with duplicate name '${name}' by ${session.user.name}.`, 'API:UserGroups:Create', session.user.id, { groupName: name });
      return NextResponse.json({ message: `A user group with the name "${name}" already exists.` }, { status: 409 });
    }
    await logAudit('ERROR', `Failed to create user group '${name}' by ${session.user.name}. Error: ${error.message}`, 'API:UserGroups:Create', session.user.id, { groupName: name });
    return NextResponse.json({ message: "Error creating user group", error: error.message }, { status: 500 });
  }
}
