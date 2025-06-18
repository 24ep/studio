
// src/app/api/users/[id]/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import pool from '../../../../lib/db';
import type { UserProfile, PlatformModuleId, UserGroup } from '@/lib/types';
import { PLATFORM_MODULES } from '@/lib/types';
import { logAudit } from '@/lib/auditLog';
import bcrypt from 'bcrypt';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const platformModuleIds = PLATFORM_MODULES.map(m => m.id) as [PlatformModuleId, ...PlatformModuleId[]];
const userRoleEnum = z.enum(['Admin', 'Recruiter', 'Hiring Manager']);

const updateUserSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  email: z.string().email("Invalid email address").optional(),
  role: userRoleEnum.optional(), // Only for Admins
  newPassword: z.string().min(6, "Password must be at least 6 characters").optional().or(z.literal('')),
  modulePermissions: z.array(z.enum(platformModuleIds)).optional(), // Only for Admins
  groupIds: z.array(z.string().uuid()).optional(), // Only for Admins
});

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  
  if (session.user.role !== 'Admin' && session.user.id !== params.id && !session.user.modulePermissions?.includes('USERS_MANAGE')) {
     await logAudit('WARN', `Forbidden attempt to GET user ${params.id} by ${session.user.name}.`, 'API:Users:GetById', session.user.id, { targetUserId: params.id });
     return NextResponse.json({ message: "Forbidden: Insufficient permissions" }, { status: 403 });
  }

  try {
    const query = `
      SELECT 
        u.id, u.name, u.email, u.role, u."avatarUrl", u."dataAiHint", u."modulePermissions", 
        u."createdAt", u."updatedAt",
        COALESCE(
          (SELECT json_agg(json_build_object('id', g.id, 'name', g.name))
           FROM "UserGroup" g
           JOIN "User_UserGroup" ugg ON g.id = ugg."groupId"
           WHERE ugg."userId" = u.id), 
          '[]'::json
        ) as groups
      FROM "User" u
      WHERE u.id = $1
    `;
    const result = await pool.query(query, [params.id]);
    if (result.rows.length === 0) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }
    const user = {
        ...result.rows[0],
        modulePermissions: result.rows[0].modulePermissions || [],
        groups: result.rows[0].groups || [],
    };
    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    console.error(`Failed to fetch user ${params.id}:`, error);
    await logAudit('ERROR', `Failed to fetch user ${params.id} by ${session.user.name}. Error: ${(error as Error).message}`, 'API:Users:GetById', session.user.id, { targetUserId: params.id });
    return NextResponse.json({ message: "Error fetching user", error: (error as Error).message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const isAdmin = session?.user?.role === 'Admin';
  const isSelfEdit = session?.user?.id === params.id;

  if (!session?.user?.id || (!isAdmin && !isSelfEdit)) {
    // If not admin and not editing self, deny
    await logAudit('WARN', `Forbidden attempt to update user ${params.id} by ${session?.user?.email || 'Unknown'}.`, 'API:Users:Update', session?.user?.id, { targetUserId: params.id });
    return NextResponse.json({ message: "Forbidden: Insufficient permissions." }, { status: 403 });
  }

  let body;
  try {
    body = await request.json();
  } catch (error) {
    console.error("Error parsing request body for user update:", error);
    return NextResponse.json({ message: "Error parsing request body", error: (error as Error).message }, { status: 400 });
  }

  const validationResult = updateUserSchema.safeParse(body);
  if (!validationResult.success) {
    return NextResponse.json(
      { message: "Invalid input", errors: validationResult.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const updates = validationResult.data;
  // If self-editing and not admin, ensure restricted fields are not in the payload
  if (isSelfEdit && !isAdmin) {
    if (updates.role !== undefined || updates.modulePermissions !== undefined || updates.groupIds !== undefined) {
      await logAudit('WARN', `User ${session.user.email} attempted to modify restricted fields during self-edit.`, 'API:Users:Update', session.user.id, { targetUserId: params.id });
      return NextResponse.json({ message: "Forbidden: You cannot modify role, permissions, or group assignments for your own account." }, { status: 403 });
    }
  }


  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const existingUserQuery = 'SELECT * FROM "User" WHERE id = $1 FOR UPDATE';
    const existingUserResult = await client.query(existingUserQuery, [params.id]);
    if (existingUserResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }
    const existingUser = existingUserResult.rows[0];

    if (updates.email && updates.email !== existingUser.email) {
      const emailCheckQuery = 'SELECT id FROM "User" WHERE email = $1 AND id != $2';
      const emailCheckResult = await client.query(emailCheckQuery, [updates.email, params.id]);
      if (emailCheckResult.rows.length > 0) {
        await client.query('ROLLBACK');
        return NextResponse.json({ message: "Another user with this email already exists." }, { status: 409 });
      }
    }
    
    const updateFields: string[] = [];
    const updateValues: any[] = [];
    let paramIndex = 1;
    const auditChanges: string[] = [];

    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        // Admin-only fields or self-edit allowed fields
        if (key === 'name' || key === 'email') {
          auditChanges.push(key);
          updateFields.push(`"${key}" = $${paramIndex++}`);
          updateValues.push(value);
        } else if (key === 'newPassword') {
          if (value && typeof value === 'string' && value.length > 0) {
            const hashedPassword = await bcrypt.hash(value, 10);
            updateFields.push(`"password" = $${paramIndex++}`);
            updateValues.push(hashedPassword);
            auditChanges.push('password (hashed)');
          }
        } else if (isAdmin) { // These fields can only be changed by an Admin
          auditChanges.push(key);
          if (key === 'modulePermissions') {
              updateFields.push(`"${key}" = $${paramIndex++}`);
              updateValues.push(value || []);
          } else if (key === 'groupIds') {
             // groupIds are handled separately after user update
          } else {
            updateFields.push(`"${key}" = $${paramIndex++}`);
            updateValues.push(value);
          }
        }
      }
    }

    if (updateFields.length > 0) {
      updateFields.push(`"updatedAt" = NOW()`);
      updateValues.push(params.id);
      const updateUserQuery = `UPDATE "User" SET ${updateFields.join(', ')} WHERE id = $${paramIndex};`;
      await client.query(updateUserQuery, updateValues);
    }

    // Handle group assignments - only if Admin
    if (isAdmin && updates.groupIds !== undefined) {
      auditChanges.push('groupIds');
      await client.query('DELETE FROM "User_UserGroup" WHERE "userId" = $1', [params.id]);
      if (updates.groupIds.length > 0) {
        const insertGroupPromises = updates.groupIds.map(groupId => {
          return client.query('INSERT INTO "User_UserGroup" ("userId", "groupId") VALUES ($1, $2)', [params.id, groupId]);
        });
        await Promise.all(insertGroupPromises);
      }
    }
    
    if (updateFields.length === 0 && (!isAdmin || updates.groupIds === undefined)) {
      await client.query('ROLLBACK'); 
      const currentUserQuery = `
        SELECT u.*, COALESCE(json_agg(json_build_object('id', g.id, 'name', g.name)) FILTER (WHERE g.id IS NOT NULL), '[]'::json) as groups
        FROM "User" u
        LEFT JOIN "User_UserGroup" ugg ON u.id = ugg."userId"
        LEFT JOIN "UserGroup" g ON ugg."groupId" = g.id
        WHERE u.id = $1
        GROUP BY u.id;
      `;
      const currentUserResult = await pool.query(currentUserQuery, [params.id]);
      if(currentUserResult.rows.length > 0) return NextResponse.json({ ...currentUserResult.rows[0], modulePermissions: currentUserResult.rows[0].modulePermissions || [], groups: currentUserResult.rows[0].groups || [] }, { status: 200 });
      return NextResponse.json({ message: "User not found or no updates provided" }, { status: 400 });
    }


    await client.query('COMMIT');
    
    const finalUserQuery = `
      SELECT 
        u.id, u.name, u.email, u.role, u."avatarUrl", u."dataAiHint", u."modulePermissions", 
        u."createdAt", u."updatedAt",
        COALESCE(
          (SELECT json_agg(json_build_object('id', g.id, 'name', g.name))
           FROM "UserGroup" g
           JOIN "User_UserGroup" ugg ON g.id = ugg."groupId"
           WHERE ugg."userId" = u.id), 
          '[]'::json
        ) as groups
      FROM "User" u
      WHERE u.id = $1
    `;
    const updatedResult = await pool.query(finalUserQuery, [params.id]);
    const updatedUser = {
        ...updatedResult.rows[0],
        modulePermissions: updatedResult.rows[0].modulePermissions || [],
        groups: updatedResult.rows[0].groups || [],
    };

    await logAudit('AUDIT', `User account '${updatedUser.name}' (ID: ${updatedUser.id}) updated by ${session.user.name}.`, 'API:Users:Update', session.user.id, { targetUserId: updatedUser.id, changes: auditChanges });
    return NextResponse.json(updatedUser, { status: 200 });

  } catch (error: any) {
    await client.query('ROLLBACK'); 
    console.error(`Failed to update user ${params.id}:`, error);
    await logAudit('ERROR', `Failed to update user ${params.id} by ${session.user.name}. Error: ${error.message}`, 'API:Users:Update', session.user.id, { targetUserId: params.id });
     if (error.code === '23505' && error.constraint === 'User_email_key') {
      return NextResponse.json({ message: "Another user with this email already exists." }, { status: 409 });
    }
    return NextResponse.json({ message: "Error updating user", error: error.message }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'Admin') {
    await logAudit('WARN', `Forbidden attempt to delete user ${params.id} by ${session?.user?.email || 'Unknown'}. Admin role required.`, 'API:Users:Delete', session?.user?.id, { targetUserId: params.id });
    return NextResponse.json({ message: "Forbidden: Admin role required to delete users." }, { status: 403 });
  }

  if (session.user.id === params.id) {
    await logAudit('WARN', `Admin user ${session.user.name} (ID: ${params.id}) attempted to delete their own account. Action denied.`, 'API:Users:Delete', session.user.id, { targetUserId: params.id });
    return NextResponse.json({ message: "Admins cannot delete their own accounts through this API." }, { status: 400 });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // Delete associations in User_UserGroup first
    await client.query('DELETE FROM "User_UserGroup" WHERE "userId" = $1', [params.id]);

    const deleteUserQuery = 'DELETE FROM "User" WHERE id = $1 RETURNING id, name';
    const result = await client.query(deleteUserQuery, [params.id]);
    if (result.rowCount === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }
    await client.query('COMMIT');
    const deletedUserName = result.rows[0].name;
    await logAudit('AUDIT', `User account '${deletedUserName}' (ID: ${params.id}) deleted by ${session.user.name}.`, 'API:Users:Delete', session.user.id, { targetUserId: params.id, deletedUserName });
    return NextResponse.json({ message: "User deleted successfully" }, { status: 200 });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`Failed to delete user ${params.id}:`, error);
    await logAudit('ERROR', `Failed to delete user ${params.id} by ${session.user.name}. Error: ${error.message}`, 'API:Users:Delete', session.user.id, { targetUserId: params.id });
    return NextResponse.json({ message: "Error deleting user", error: (error as Error).message }, { status: 500 });
  } finally {
    client.release();
  }
}
