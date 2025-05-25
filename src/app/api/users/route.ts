
// src/app/api/users/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { z } from 'zod';
import pool from '../../../lib/db';
import type { UserProfile } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

const userRoleEnum = z.enum(['Admin', 'Recruiter', 'Hiring Manager']);

const createUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters long"), // Added password
  role: userRoleEnum,
});

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const userRole = session.user.role;
  if (userRole !== 'Admin') {
    return NextResponse.json({ message: "Forbidden: Only Admins can view all users." }, { status: 403 });
  }

  try {
    const result = await pool.query('SELECT id, name, email, role, "avatarUrl", "dataAiHint", "createdAt", "updatedAt" FROM "User" ORDER BY "createdAt" DESC');
    return NextResponse.json(result.rows, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch users:", error);
    return NextResponse.json({ message: "Error fetching users", error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const userRole = session.user.role;
  if (userRole !== 'Admin') {
    return NextResponse.json({ message: "Forbidden: Only Admins can create users." }, { status: 403 });
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

  const { name, email, password, role } = validationResult.data;

  // IMPORTANT: In production, you MUST hash the password here before storing it.
  // Example using bcrypt (install bcrypt: npm install bcrypt @types/bcrypt):
  // const bcrypt = require('bcrypt');
  // const saltRounds = 10;
  // const hashedPassword = await bcrypt.hash(password, saltRounds);
  const plainPasswordForNow = password; // Replace with hashedPassword

  try {
    const checkEmailQuery = 'SELECT id FROM "User" WHERE email = $1';
    const emailCheckResult = await pool.query(checkEmailQuery, [email]);
    if (emailCheckResult.rows.length > 0) {
      return NextResponse.json({ message: "User with this email already exists." }, { status: 409 });
    }

    const defaultAvatarUrl = `https://placehold.co/100x100.png?text=${name.charAt(0)}`;
    const defaultDataAiHint = "profile person";

    const insertQuery = `
      INSERT INTO "User" (id, name, email, password, role, "avatarUrl", "dataAiHint", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      RETURNING id, name, email, role, "avatarUrl", "dataAiHint", "createdAt", "updatedAt";
    `;
    // Use plainPasswordForNow - MUST BE REPLACED WITH HASHED PASSWORD IN PRODUCTION
    const result = await pool.query(insertQuery, [uuidv4(), name, email, plainPasswordForNow, role, defaultAvatarUrl, defaultDataAiHint]);
    
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error: any) {
    console.error("Failed to create user:", error);
    if (error.code === '23505' && error.constraint === 'User_email_key') { // Double check constraint name
      return NextResponse.json({ message: "User with this email already exists." }, { status: 409 });
    }
    return NextResponse.json({ message: "Error creating user", error: error.message }, { status: 500 });
  }
}
    