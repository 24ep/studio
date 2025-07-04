// src/app/api/settings/user-groups/[id]/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import pool from '../../../../../lib/db';
import { z } from 'zod';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import type { UserGroup } from '@/lib/types';
import { logAudit } from '@/lib/auditLog';

const updateGroupFormSchema = z.object({
  name: z.string().min(1, "Group name is required").max(100),
  description: z.string().optional().nullable(),
});

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'Admin' && !session?.user?.modulePermissions?.includes('USER_GROUPS_MANAGE')) {
    await logAudit('WARN', `Forbidden attempt to GET user group (ID: ${params.id}) by user ${session?.user?.email || 'Unknown'}.`, 'API:UserGroups:GetById', session?.user?.id, { targetGroupId: params.id });
    return NextResponse.json({ message: "Forbidden: Insufficient permissions" }, { status: 403 });
  }

  try {
    const result = await pool.query('SELECT id, name, description, "createdAt", "updatedAt" FROM "UserGroup" WHERE id = $1', [params.id]);
    if (result.rows.length === 0) {
      return NextResponse.json({ message: "User group not found" }, { status: 404 });
    }
    return NextResponse.json(result.rows[0], { status: 200 });
  } catch (error) {
    console.error(`Failed to fetch user group ${params.id}:`, error);
    await logAudit('ERROR', `Failed to fetch user group (ID: ${params.id}) by ${session?.user?.name}. Error: ${(error as Error).message}`, 'API:UserGroups:GetById', session?.user?.id, { targetGroupId: params.id });
    return NextResponse.json({ message: "Error fetching user group", error: (error as Error).message }, { status: 500 });
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
  
  const { name, description } = validationResult.data;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const existingGroupResult = await client.query('SELECT * FROM "UserGroup" WHERE id = $1 FOR UPDATE', [params.id]);
    if (existingGroupResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({ message: "User group not found" }, { status: 404 });
    }
    
    if (name !== existingGroupResult.rows[0].name) {
        const nameCheck = await client.query('SELECT id FROM "UserGroup" WHERE name = $1 AND id != $2', [name, params.id]);
        if (nameCheck.rows.length > 0) {
            await client.query('ROLLBACK');
            return NextResponse.json({ message: "Another user group with this name already exists." }, { status: 409 });
        }
    }

    const updateQuery = `
      UPDATE "UserGroup"
      SET name = $1, description = $2, "updatedAt" = NOW()
      WHERE id = $3
      RETURNING id, name, description, "createdAt", "updatedAt";
    `;
    const updateResult = await client.query(updateQuery, [name, description, params.id]);
    await client.query('COMMIT');
    await logAudit('AUDIT', `User group '${name}' (ID: ${params.id}) updated by ${session.user.name}.`, 'API:UserGroups:Update', session.user.id, { targetGroupId: params.id, changes: Object.keys(validationResult.data) });
    return NextResponse.json(updateResult.rows[0], { status: 200 });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error(`Failed to update user group ${params.id}:`, error);
    if (error.code === '23505' && error.constraint === 'UserGroup_name_key') {
      await logAudit('WARN', `Attempt to update user group resulting in duplicate name for ID ${params.id} by ${session.user.name}.`, 'API:UserGroups:Update', session.user.id, { targetGroupId: params.id, attemptedName: name });
      return NextResponse.json({ message: "A user group with this name already exists." }, { status: 409 });
    }
    await logAudit('ERROR', `Failed to update user group (ID: ${params.id}) by ${session.user.name}. Error: ${error.message}`, 'API:UserGroups:Update', session.user.id, { targetGroupId: params.id });
    return NextResponse.json({ message: "Error updating user group", error: error.message }, { status: 500 });
  } finally {
    client.release();
  }
}