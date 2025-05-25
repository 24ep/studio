
import { NextResponse, type NextRequest } from 'next/server';
import prisma from '../../../../lib/prisma'; // Changed from '@/lib/prisma'
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { z } from 'zod';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const position = await prisma.position.findUnique({
      where: { id: params.id },
    });
    if (!position) {
      return NextResponse.json({ message: "Position not found" }, { status: 404 });
    }
    return NextResponse.json(position, { status: 200 });
  } catch (error) {
    console.error(`Failed to fetch position ${params.id}:`, error);
    return NextResponse.json({ message: "Error fetching position", error: (error as Error).message }, { status: 500 });
  }
}

const updatePositionSchema = z.object({
  title: z.string().min(1, { message: "Title cannot be empty" }).optional(),
  department: z.string().min(1, { message: "Department cannot be empty" }).optional(),
  description: z.string().optional(),
  isOpen: z.boolean().optional(),
});

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  // TODO: Add role-based authorization if needed

  let body;
  try {
    body = await request.json();
  } catch (error) {
    console.error(`Error parsing JSON body for updating position ${params.id}:`, error);
    return NextResponse.json({ message: "Error parsing request body", error: (error as Error).message }, { status: 400 });
  }

  const validationResult = updatePositionSchema.safeParse(body);
  if (!validationResult.success) {
    return NextResponse.json(
      { message: "Invalid input", errors: validationResult.error.flatten().fieldErrors },
      { status: 400 }
    );
  }
  
  const validatedData = validationResult.data;
  
  try {
    const positionExists = await prisma.position.findUnique({ where: { id: params.id } });
    if (!positionExists) {
      return NextResponse.json({ message: "Position not found" }, { status: 404 });
    }

    const updatedPosition = await prisma.position.update({
      where: { id: params.id },
      data: validatedData,
    });
    
    return NextResponse.json(updatedPosition, { status: 200 });
  } catch (error) {
    console.error(`Failed to update position ${params.id}:`, error);
    return NextResponse.json({ message: "Error updating position", error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  // TODO: Add role-based authorization if needed

  try {
    const positionExists = await prisma.position.findUnique({ 
      where: { id: params.id },
      include: { _count: { select: { candidates: true } } } // Check if candidates are associated
    });

    if (!positionExists) {
      return NextResponse.json({ message: "Position not found" }, { status: 404 });
    }

    // Prevent deletion if candidates are associated, unless cascade delete is intended and carefully considered.
    // The Prisma schema uses onDelete: Restrict for Candidate.positionId, so DB will prevent this.
    // This check provides a friendlier error message.
    if (positionExists._count.candidates > 0) {
        return NextResponse.json({ message: "Cannot delete position with associated candidates. Please reassign or delete candidates first." }, { status: 409 }); // Conflict
    }
    
    await prisma.position.delete({
      where: { id: params.id },
    });
    
    return NextResponse.json({ message: "Position deleted successfully" }, { status: 200 });
  } catch (error: any) {
     console.error(`Failed to delete position ${params.id}:`, error);
     if (error.code === 'P2003') { // Foreign key constraint failed (e.g. candidates still linked)
        return NextResponse.json({ message: "Cannot delete this position as it is still referenced by candidates." }, { status: 409 });
     }
    return NextResponse.json({ message: "Error deleting position", error: error.message }, { status: 500 });
  }
}
