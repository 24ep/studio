
// src/app/api/users/[id]/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import pool from '../../../../lib/db';
import type { UserProfile, PlatformModuleId } from '@/lib/types';
import { PLATFORM_MODULES } from '@/lib/types';
import { logAudit } from '@/lib/auditLog';
import bcrypt from 'bcrypt';

const platformModuleIds = PLATFORM_MODULES.map(m => m.id) as [PlatformModuleId, ...PlatformModuleId[]];
const userRoleEnum = z.enum(['Admin', 'Recruiter', 'Hiring Manager']);

const updateUserSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  email: z.string().email("Invalid email address").optional(),
  role: userRoleEnum.optional(),
  newPassword: z.string().min(6, "Password must be at least 6 characters").optional().or(z.literal('')),
  modulePermissions: z.array(z.enum(platformModuleIds)).optional(),
});

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const query = 'SELECT id, name, email, role, "avatarUrl", "dataAiHint", "modulePermissions", "createdAt", "updatedAt" FROM "User" WHERE id = $1';
    const result = await pool.query(query, [params.id]);
    if (result.rows.length === 0) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }
    const user = {
        ...result.rows[0],
        modulePermissions: result.rows[0].modulePermissions || []
    };
    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    console.error(`Failed to fetch user ${params.id}:`, error);
    await logAudit('ERROR', `Failed to fetch user ${params.id}. Error: ${(error as Error).message}`, 'API:Users', null, { targetUserId: params.id });
    return NextResponse.json({ message: "Error fetching user", error: (error as Error).message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
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
        auditChanges.push(key);
        if (key === 'newPassword') {
          if (value && typeof value === 'string' && value.length > 0) {
            const hashedPassword = await bcrypt.hash(value, 10);
            updateFields.push(`"password" = $${paramIndex++}`);
            updateValues.push(hashedPassword);
            auditChanges.push('password (hashed)');
          }
          const newPasswordIndex = auditChanges.indexOf('newPassword');
          if (newPasswordIndex > -1) auditChanges.splice(newPasswordIndex, 1);
        } else if (key === 'modulePermissions') {
            updateFields.push(`"${key}" = $${paramIndex++}`);
            updateValues.push(value || []);
        } else {
          updateFields.push(`"${key}" = $${paramIndex++}`);
          updateValues.push(value);
        }
      }
    }

    if (updateFields.length === 0) {
      await client.query('ROLLBACK');
      const currentUser = await pool.query('SELECT id, name, email, role, "avatarUrl", "dataAiHint", "modulePermissions", "createdAt", "updatedAt" FROM "User" WHERE id = $1', [params.id]);
      if(currentUser.rows.length > 0) return NextResponse.json({ ...currentUser.rows[0], modulePermissions: currentUser.rows[0].modulePermissions || [] }, { status: 200 });
      return NextResponse.json({ message: "User not found or no updates provided" }, { status: 400 });
    }

    updateFields.push(`"updatedAt" = NOW()`);
    updateValues.push(params.id);

    const updateQuery = `UPDATE "User" SET ${updateFields.join(', ')} WHERE id = $${paramIndex} RETURNING id, name, email, role, "avatarUrl", "dataAiHint", "modulePermissions", "createdAt", "updatedAt";`;
    const updatedResult = await client.query(updateQuery, updateValues);
    const updatedUser = {
        ...updatedResult.rows[0],
        modulePermissions: updatedResult.rows[0].modulePermissions || []
    };
    await client.query('COMMIT');

    await logAudit('AUDIT', `User account '${updatedUser.name}' (ID: ${updatedUser.id}) updated.`, 'API:Users', null, { targetUserId: updatedUser.id, changes: auditChanges });
    return NextResponse.json(updatedUser, { status: 200 });

  } catch (error: any) {
    await client.query('ROLLBACK'); 
    console.error(`Failed to update user ${params.id}:`, error);
    await logAudit('ERROR', `Failed to update user ${params.id}. Error: ${error.message}`, 'API:Users', null, { targetUserId: params.id });
     if (error.code === '23505' && error.constraint === 'User_email_key') {
      return NextResponse.json({ message: "Another user with this email already exists." }, { status: 409 });
    }
    return NextResponse.json({ message: "Error updating user", error: error.message }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const deleteQuery = 'DELETE FROM "User" WHERE id = $1 RETURNING id, name';
    const result = await pool.query(deleteQuery, [params.id]);
    if (result.rowCount === 0) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }
    const deletedUserName = result.rows[0].name;
    await logAudit('AUDIT', `User account '${deletedUserName}' (ID: ${params.id}) deleted.`, 'API:Users', null, { targetUserId: params.id, deletedUserName });
    return NextResponse.json({ message: "User deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error(`Failed to delete user ${params.id}:`, error);
    await logAudit('ERROR', `Failed to delete user ${params.id}. Error: ${(error as Error).message}`, 'API:Users', null, { targetUserId: params.id });
    return NextResponse.json({ message: "Error deleting user", error: (error as Error).message }, { status: 500 });
  }
}

    