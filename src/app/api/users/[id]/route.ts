
// src/app/api/users/[id]/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { z } from 'zod';
import pool from '../../../../lib/db';
import type { UserProfile } from '@/lib/types';

const userRoleEnum = z.enum(['Admin', 'Recruiter', 'Hiring Manager']);

const updateUserSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  email: z.string().email("Invalid email address").optional(), // Email updates might need special handling/verification
  role: userRoleEnum.optional(),
  // Password updates are more complex (current password, new password, hashing) and are omitted here for simplicity
});

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const userRole = session.user.role;
  if (userRole !== 'Admin' && session.user.id !== params.id) {
    return NextResponse.json({ message: "Forbidden: Insufficient permissions." }, { status: 403 });
  }

  try {
    const query = 'SELECT id, name, email, role, "avatarUrl", "dataAiHint", "createdAt", "updatedAt" FROM "User" WHERE id = $1';
    const result = await pool.query(query, [params.id]);
    if (result.rows.length === 0) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }
    return NextResponse.json(result.rows[0], { status: 200 });
  } catch (error) {
    console.error(`Failed to fetch user ${params.id}:`, error);
    return NextResponse.json({ message: "Error fetching user", error: (error as Error).message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const userRole = session.user.role;
  if (userRole !== 'Admin') {
    // Allow users to update their own name, but only Admins can change roles or other users.
    // For simplicity, this prototype restricts all PUTs to Admins.
    // More granular control could be added:
    // if (session.user.id !== params.id) {
    //   return NextResponse.json({ message: "Forbidden: You can only update your own profile." }, { status: 403 });
    // }
    // if (body.role && body.role !== session.user.role) {
    //    return NextResponse.json({ message: "Forbidden: You cannot change your own role." }, { status: 403 });
    // }
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

  try {
    const client = await pool.connect();
    await client.query('BEGIN');

    const existingUserQuery = 'SELECT * FROM "User" WHERE id = $1 FOR UPDATE'; // Lock row for update
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
      return NextResponse.json(existingUser, { status: 200 }); // No actual changes
    }

    updateFields.push(`"updatedAt" = NOW()`);
    updateValues.push(params.id); // For the WHERE clause

    const updateQuery = `UPDATE "User" SET ${updateFields.join(', ')} WHERE id = $${paramIndex} RETURNING id, name, email, role, "avatarUrl", "dataAiHint", "createdAt", "updatedAt";`;
    const updatedResult = await client.query(updateQuery, updateValues);
    
    await client.query('COMMIT');
    return NextResponse.json(updatedResult.rows[0], { status: 200 });

  } catch (error: any) {
    await (await pool.connect()).query('ROLLBACK'); // Ensure rollback on error
    console.error(`Failed to update user ${params.id}:`, error);
     if (error.code === '23505' && error.constraint === 'User_email_key') {
      return NextResponse.json({ message: "Another user with this email already exists." }, { status: 409 });
    }
    return NextResponse.json({ message: "Error updating user", error: error.message }, { status: 500 });
  } finally {
    // Release client in the calling code if necessary, pool handles it generally
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const userRole = session.user.role;
  if (userRole !== 'Admin') {
    return NextResponse.json({ message: "Forbidden: Only Admins can delete users." }, { status: 403 });
  }
  
  if (session.user.id === params.id) {
     return NextResponse.json({ message: "Cannot delete your own account." }, { status: 403 });
  }

  try {
    const deleteQuery = 'DELETE FROM "User" WHERE id = $1 RETURNING id';
    const result = await pool.query(deleteQuery, [params.id]);
    if (result.rowCount === 0) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }
    return NextResponse.json({ message: "User deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error(`Failed to delete user ${params.id}:`, error);
    return NextResponse.json({ message: "Error deleting user", error: (error as Error).message }, { status: 500 });
  }
}
    