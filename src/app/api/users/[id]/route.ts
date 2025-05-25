
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
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const userRole = session.user.role;
  if (userRole !== 'Admin') {
     // Allow users to fetch their own profile, or admins to fetch any
     if (session.user.id !== params.id) {
        return NextResponse.json({ message: "Forbidden: Insufficient permissions." }, { status: 403 });
     }
  }

  const user = mockAppUsers.find(u => u.id === params.id);
  if (!user) {
    return NextResponse.json({ message: "User not found" }, { status: 404 });
  }
  // Return a simplified user object, excluding sensitive info if necessary
  const { ...userProfile } = user; // Spread to omit potential sensitive fields if any were added
  return NextResponse.json(userProfile, { status: 200 });
}


export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const userRole = session.user.role;
  if (userRole !== 'Admin') {
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

  const userToUpdate = mockAppUsers.find(u => u.id === params.id);
  if (!userToUpdate) {
    return NextResponse.json({ message: "User not found" }, { status: 404 });
  }

  if (updates.email && updates.email !== userToUpdate.email && mockAppUsers.some(user => user.email === updates.email && user.id !== params.id)) {
    return NextResponse.json({ message: "Another user with this email already exists." }, { status: 409 });
  }
  
  const updatedUser = updateUserInMockData(params.id, updates);


  if (!updatedUser) { // Should not happen if userToUpdate was found, but as a safeguard
    return NextResponse.json({ message: "User not found or update failed" }, { status: 404 });
  }
  
  return NextResponse.json(updatedUser, { status: 200 });
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
  
  const userIndex = mockAppUsers.findIndex(u => u.id === params.id);
  if (userIndex === -1) {
    return NextResponse.json({ message: "User not found" }, { status: 404 });
  }

  // Prevent deleting oneself if that's a desired rule
  if (session.user.id === params.id) {
     return NextResponse.json({ message: "Cannot delete your own account." }, { status: 403 });
  }

  mockAppUsers.splice(userIndex, 1);

  return NextResponse.json({ message: "User deleted successfully" }, { status: 200 });
}
