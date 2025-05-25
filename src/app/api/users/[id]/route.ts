
// src/app/api/users/[id]/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { z } from 'zod';
import { mockAppUsers, updateUserInMockData } from '@/lib/data'; // Using mock data for now
import type { UserProfile } from '@/lib/types';

const userRoleEnum = z.enum(['Admin', 'Recruiter', 'Hiring Manager']);

const updateUserSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  email: z.string().email("Invalid email address").optional(),
  role: userRoleEnum.optional(),
});

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const user = mockAppUsers.find(u => u.id === params.id);
  if (!user) {
    return NextResponse.json({ message: "User not found" }, { status: 404 });
  }
  return NextResponse.json(user, { status: 200 });
}


export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  // Add role check here: only Admins should update users
  // if (session.user.role !== 'Admin') { 
  //   return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  // }

  let body;
  try {
    body = await request.json();
  } catch (error) {
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

  // In a real app, you'd update in a database.
  const updatedUser = updateUserInMockData(params.id, updates);

  if (!updatedUser) {
    return NextResponse.json({ message: "User not found" }, { status: 404 });
  }
  
  // Check for email conflict if email is being changed
  if (updates.email && mockAppUsers.some(user => user.email === updates.email && user.id !== params.id)) {
    // Note: This is a simplified conflict check. Ideally, this check happens before attempting the update.
    // For mock data, we might just warn or allow it, as rolling back mock data changes is trivial.
    // A real DB would handle this with a unique constraint.
    // return NextResponse.json({ message: "Another user with this email already exists." }, { status: 409 });
  }


  return NextResponse.json(updatedUser, { status: 200 });
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  // Add role check here: only Admins should delete users
  // if (session.user.role !== 'Admin') { 
  //   return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  // }
  
  const userIndex = mockAppUsers.findIndex(u => u.id === params.id);
  if (userIndex === -1) {
    return NextResponse.json({ message: "User not found" }, { status: 404 });
  }

  // In a real app, you'd delete from a database.
  mockAppUsers.splice(userIndex, 1);

  return NextResponse.json({ message: "User deleted successfully" }, { status: 200 });
}

    