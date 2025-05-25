
// src/app/api/users/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import pool from '../../../lib/db';
import type { UserProfile, PlatformModuleId } from '@/lib/types';
import { PLATFORM_MODULES } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';
import { logAudit } from '@/lib/auditLog';

const platformModuleIds = PLATFORM_MODULES.map(m => m.id) as [PlatformModuleId, ...PlatformModuleId[]];

const userRoleEnum = z.enum(['Admin', 'Recruiter', 'Hiring Manager']);

const createUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
  role: userRoleEnum,
  modulePermissions: z.array(z.enum(platformModuleIds)).optional().default([]),
});

export async function GET(request: NextRequest) {
  try {
    const result = await pool.query('SELECT id, name, email, role, "avatarUrl", "dataAiHint", "modulePermissions", "createdAt", "updatedAt" FROM "User" ORDER BY "createdAt" DESC');
    return NextResponse.json(result.rows.map(user => ({
      ...user,
      modulePermissions: user.modulePermissions || []
    })), { status: 200 });
  } catch (error) {
    console.error("Failed to fetch users:", error);
    await logAudit('ERROR', `Failed to fetch users. Error: ${(error as Error).message}`, 'API:Users', null);
    return NextResponse.json({ message: "Error fetching users", error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
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

  const { name, email, password, role, modulePermissions } = validationResult.data;

  const saltRounds = 10;
  let hashedPassword;
  try {
    hashedPassword = await bcrypt.hash(password, saltRounds);
  } catch (hashError) {
    console.error("Error hashing password:", hashError);
    await logAudit('ERROR', `Error hashing password for new user ${email}. Error: ${(hashError as Error).message}`, 'API:Users', null);
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

    const insertQuery = `
      INSERT INTO "User" (id, name, email, password, role, "avatarUrl", "dataAiHint", "modulePermissions", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      RETURNING id, name, email, role, "avatarUrl", "dataAiHint", "modulePermissions", "createdAt", "updatedAt";
    `;
    const result = await client.query(insertQuery, [newUserId, name, email, hashedPassword, role, defaultAvatarUrl, defaultDataAiHint, modulePermissions || []]);
    const newUser = {
        ...result.rows[0],
        modulePermissions: result.rows[0].modulePermissions || []
    };
    await client.query('COMMIT');
    
    await logAudit('AUDIT', `User account '${newUser.name}' (ID: ${newUser.id}) created.`, 'API:Users', null, { targetUserId: newUser.id, role: newUser.role, permissions: newUser.modulePermissions });
    return NextResponse.json(newUser, { status: 201 });

  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error("Failed to create user:", error);
    await logAudit('ERROR', `Failed to create user ${email}. Error: ${error.message}`, 'API:Users', null);
    if (error.code === '23505' && error.constraint === 'User_email_key') {
      return NextResponse.json({ message: "User with this email already exists." }, { status: 409 });
    }
    return NextResponse.json({ message: "Error creating user", error: error.message }, { status: 500 });
  } finally {
    client.release();
  }
}

    