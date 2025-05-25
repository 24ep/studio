
// src/app/api/users/[id]/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { z } from 'zod';
import pool from '../../../../lib/db';
import type { UserProfile } from '@/lib/types';
import { logAudit } from '@/lib/auditLog';

const userRoleEnum = z.enum(['Admin', 'Recruiter', 'Hiring Manager']);

const updateUserSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  email: z.string().email("Invalid email address").optional(),
  role: userRoleEnum.optional(),
  // Password updates are not handled here.
});

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  
  if (session.user.role !== 'Admin' && session.user.id !== params.id) {
    await logAudit('WARN', `Forbidden attempt to view user (ID: ${params.id}) by ${session.user.name} (ID: ${session.user.id}). Required role: Admin or self.`, 'API:Users', session.user.id, { targetUserId: params.id });
    return NextResponse.json({ message: "Forbidden: Insufficient permissions." }, { status: 403 });
  }

  try {
    const query = 'SELECT id, name, email, role, "avatarUrl", "dataAiHint", "createdAt", "updatedAt" FROM "User" WHERE id = $1';
    const result = await pool.query(query, [params.id]);
    if (result.rows.length === 0) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }
    // await logAudit('AUDIT', `User details (ID: ${params.id}) retrieved by ${session.user.name} (ID: ${session.user.id}).`, 'API:Users', session.user.id, { targetUserId: params.id }); // Can be too verbose
    return NextResponse.json(result.rows[0], { status: 200 });
  } catch (error) {
    console.error(`Failed to fetch user ${params.id}:`, error);
    await logAudit('ERROR', `Failed to fetch user ${params.id}. Error: ${(error as Error).message}`, 'API:Users', session.user.id, { targetUserId: params.id });
    return NextResponse.json({ message: "Error fetching user", error: (error as Error).message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  
  if (session.user.role !== 'Admin') {
    await logAudit('WARN', `Forbidden attempt to update user (ID: ${params.id}) by ${session.user.name} (ID: ${session.user.id}). Required role: Admin.`, 'API:Users', session.user.id, { targetUserId: params.id });
    return NextResponse.json({ message: "Forbidden: Only Admins can update users." }, { status: 403 });
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

  if (Object.keys(updates).length === 0) {
    const currentUser = await pool.query('SELECT id, name, email, role, "avatarUrl", "dataAiHint", "createdAt", "updatedAt" FROM "User" WHERE id = $1', [params.id]);
    if(currentUser.rows.length > 0) return NextResponse.json(currentUser.rows[0], { status: 200 });
    return NextResponse.json({ message: "User not found or no updates provided" }, { status: 400 });
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

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields.push(`"${key}" = $${paramIndex++}`);
        updateValues.push(value);
      }
    });

    if (updateFields.length === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json(existingUser, { status: 200 }); 
    }

    updateFields.push(`"updatedAt" = NOW()`);
    updateValues.push(params.id); 

    const updateQuery = `UPDATE "User" SET ${updateFields.join(', ')} WHERE id = $${paramIndex} RETURNING id, name, email, role, "avatarUrl", "dataAiHint", "createdAt", "updatedAt";`;
    const updatedResult = await client.query(updateQuery, updateValues);
    const updatedUser = updatedResult.rows[0];
    await client.query('COMMIT');

    await logAudit('AUDIT', `User account '${updatedUser.name}' (ID: ${updatedUser.id}) updated by ${session.user.name} (ID: ${session.user.id}).`, 'API:Users', session.user.id, { targetUserId: updatedUser.id, changes: Object.keys(updates) });
    return NextResponse.json(updatedUser, { status: 200 });

  } catch (error: any) {
    await client.query('ROLLBACK'); 
    console.error(`Failed to update user ${params.id}:`, error);
    await logAudit('ERROR', `Failed to update user ${params.id}. Error: ${error.message}`, 'API:Users', session.user.id, { targetUserId: params.id });
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
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  
  if (session.user.role !== 'Admin') {
    await logAudit('WARN', `Forbidden attempt to delete user (ID: ${params.id}) by ${session.user.name} (ID: ${session.user.id}). Required role: Admin.`, 'API:Users', session.user.id, { targetUserId: params.id });
    return NextResponse.json({ message: "Forbidden: Only Admins can delete users." }, { status: 403 });
  }
  
  if (session.user.id === params.id) {
    await logAudit('WARN', `Attempt to delete own account by ${session.user.name} (ID: ${session.user.id}). Action denied.`, 'API:Users', session.user.id, { targetUserId: params.id });
     return NextResponse.json({ message: "Cannot delete your own account." }, { status: 403 });
  }

  try {
    const deleteQuery = 'DELETE FROM "User" WHERE id = $1 RETURNING id, name'; // Return name for logging
    const result = await pool.query(deleteQuery, [params.id]);
    if (result.rowCount === 0) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }
    const deletedUserName = result.rows[0].name;
    await logAudit('AUDIT', `User account '${deletedUserName}' (ID: ${params.id}) deleted by ${session.user.name} (ID: ${session.user.id}).`, 'API:Users', session.user.id, { targetUserId: params.id, deletedUserName });
    return NextResponse.json({ message: "User deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error(`Failed to delete user ${params.id}:`, error);
    await logAudit('ERROR', `Failed to delete user ${params.id}. Error: ${(error as Error).message}`, 'API:Users', session.user.id, { targetUserId: params.id });
    return NextResponse.json({ message: "Error deleting user", error: (error as Error).message }, { status: 500 });
  }
}
