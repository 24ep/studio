
// src/app/api/users/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import pool from '../../../lib/db';
import type { UserProfile, PlatformModuleId, UserGroup } from '@/lib/types';
import { PLATFORM_MODULES } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';
import { logAudit } from '@/lib/auditLog';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';


const platformModuleIds = PLATFORM_MODULES.map(m => m.id) as [PlatformModuleId, ...PlatformModuleId[]];

const userRoleEnum = z.enum(['Admin', 'Recruiter', 'Hiring Manager']);

const createUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
  role: userRoleEnum,
  modulePermissions: z.array(z.enum(platformModuleIds)).optional().default([]),
  groupIds: z.array(z.string().uuid()).optional().default([]), // New: for group assignment
});

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  
  const userRole = session.user.role;
  const { searchParams } = new URL(request.url);
  const filterRole = searchParams.get('role');

  let query = `
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
  `;
  const queryParams = [];
  let paramIndex = 1;
  const conditions = [];

  if (userRole === 'Admin') {
    if (filterRole) {
      conditions.push(`u.role = $${paramIndex++}`);
      queryParams.push(filterRole);
    }
  } else if (userRole === 'Recruiter') {
    // Recruiters can only fetch other Recruiters (for assignment dropdowns)
    conditions.push(`u.role = $${paramIndex++}`);
    queryParams.push('Recruiter');
  } else if (userRole !== 'Admin' && !session.user.modulePermissions?.includes('USERS_MANAGE')) {
    // Hiring Managers or other roles cannot list users by default unless they have USERS_MANAGE permission
    // For now, this also covers the case where no specific role filter means they can't list users.
     await logAudit('WARN', `Forbidden attempt to list users by ${session.user.name} (Role: ${userRole}).`, 'API:Users:Get', session.user.id);
    return NextResponse.json({ message: "Forbidden: Insufficient permissions" }, { status: 403 });
  }
  // If userRole is Admin and no filterRole, or userRole has USERS_MANAGE, they see all users (respecting other filters if any)


  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }
  
  query += ' ORDER BY u."createdAt" DESC';

  try {
    const result = await pool.query(query, queryParams);
    return NextResponse.json(result.rows.map(user => ({
      ...user,
      modulePermissions: user.modulePermissions || [],
      groups: user.groups || [],
    })), { status: 200 });
  } catch (error) {
    console.error("Failed to fetch users:", error);
    await logAudit('ERROR', `Failed to fetch users by ${session.user.name}. Error: ${(error as Error).message}`, 'API:Users:Get', session.user.id);
    return NextResponse.json({ message: "Error fetching users", error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'Admin') {
    await logAudit('WARN', `Forbidden attempt to create user by ${session?.user?.email || 'Unknown'} (ID: ${session?.user?.id || 'N/A'}). Required role: Admin.`, 'API:Users:Create', session.user.id);
    return NextResponse.json({ message: "Forbidden: You must be an Admin to create users." }, { status: 403 });
  }
  
  let body;
  try {
    body = await request.json();
  } catch (error) {
    console.error("Error parsing request body for new user:", error);
    return NextResponse.json({ message: "Error parsing request body", error: (error as Error).message }, { status: 400 });
  }

  const validationResult = createUserSchema.safeParse(body);
  if (!validationResult.success) {
    return NextResponse.json(
      { message: "Invalid input", errors: validationResult.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { name, email, password, role, modulePermissions, groupIds } = validationResult.data;

  const saltRounds = 10;
  let hashedPassword;
  try {
    hashedPassword = await bcrypt.hash(password, saltRounds);
  } catch (hashError) {
    console.error("Error hashing password:", hashError);
    await logAudit('ERROR', `Error hashing password for new user ${email} by ${session.user.name}. Error: ${(hashError as Error).message}`, 'API:Users:Create', session.user.id);
    return NextResponse.json({ message: "Error processing user creation (hashing failed)." }, { status: 500 });
  }
  
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const checkEmailQuery = 'SELECT id FROM "User" WHERE email = $1';
    const emailCheckResult = await client.query(checkEmailQuery, [email]);
    if (emailCheckResult.rows.length > 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({ message: "User with this email already exists." }, { status: 409 });
    }

    const defaultAvatarUrl = `https://placehold.co/100x100.png?text=${name.charAt(0).toUpperCase()}`;
    const defaultDataAiHint = "profile person";
    const newUserId = uuidv4();

    const insertUserQuery = `
      INSERT INTO "User" (id, name, email, password, role, "avatarUrl", "dataAiHint", "modulePermissions", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      RETURNING id, name, email, role, "avatarUrl", "dataAiHint", "modulePermissions", "createdAt", "updatedAt";
    `;
    const userResult = await client.query(insertUserQuery, [newUserId, name, email, hashedPassword, role, defaultAvatarUrl, defaultDataAiHint, modulePermissions || []]);
    let newUser = userResult.rows[0];

    if (groupIds && groupIds.length > 0) {
      const insertGroupPromises = groupIds.map(groupId => {
        return client.query('INSERT INTO "User_UserGroup" ("userId", "groupId") VALUES ($1, $2)', [newUserId, groupId]);
      });
      await Promise.all(insertGroupPromises);
    }

    // Fetch the user again with group data
     const finalUserQuery = `
      SELECT 
        u.*,
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
    const finalUserResult = await client.query(finalUserQuery, [newUserId]);
    newUser = { ...finalUserResult.rows[0], modulePermissions: finalUserResult.rows[0].modulePermissions || [], groups: finalUserResult.rows[0].groups || [] };


    await client.query('COMMIT');
    
    await logAudit('AUDIT', `User account '${newUser.name}' (ID: ${newUser.id}) created by ${session.user.name}.`, 'API:Users:Create', session.user.id, { targetUserId: newUser.id, role: newUser.role, permissions: newUser.modulePermissions, groups: groupIds });
    return NextResponse.json(newUser, { status: 201 });

  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error("Failed to create user:", error);
    await logAudit('ERROR', `Failed to create user ${email} by ${session.user.name}. Error: ${error.message}`, 'API:Users:Create', session.user.id);
    if (error.code === '23505' && error.constraint === 'User_email_key') {
      return NextResponse.json({ message: "User with this email already exists." }, { status: 409 });
    }
    return NextResponse.json({ message: "Error creating user", error: error.message }, { status: 500 });
  } finally {
    client.release();
  }
}
