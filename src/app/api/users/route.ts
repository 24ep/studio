
// src/app/api/users/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { z } from 'zod';
import { mockAppUsers, addUserToMockData } from '@/lib/data'; // Using mock data for now
import type { UserProfile } from '@/lib/types';

const userRoleEnum = z.enum(['Admin', 'Recruiter', 'Hiring Manager']);

const createUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
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

  // In a real app, you'd fetch from a database. Here, we use mock data.
  // Also, consider pagination for real user lists.
  return NextResponse.json(mockAppUsers, { status: 200 });
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

  const { name, email, role } = validationResult.data;

  if (mockAppUsers.some(user => user.email === email)) {
    return NextResponse.json({ message: "User with this email already exists." }, { status: 409 });
  }

  const newUser = addUserToMockData({ name, email, role });

  return NextResponse.json(newUser, { status: 201 });
}
