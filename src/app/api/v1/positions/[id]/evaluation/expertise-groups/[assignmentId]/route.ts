import { auth } from '@/auth';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { readRequestJsonResult } from '@/lib/request-json';
import { z } from 'zod';

const updateExpertiseGroupAssignmentSchema = z.object({
  isRequired: z.boolean().optional(),
  weight: z.number().min(0).max(10).optional()
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; assignmentId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { assignmentId } = await params;
    const body = await readRequestJsonResult(request);
    if (!body.ok) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    const validatedData = updateExpertiseGroupAssignmentSchema.parse(body.value);

    // Check if assignment exists
    const existingAssignment = await prisma.positionExpertiseGroup.findUnique({
      where: { id: assignmentId }
    });

    if (!existingAssignment) {
      return NextResponse.json(
        { error: 'Expertise group assignment not found' },
        { status: 404 }
      );
    }

    // Update the assignment
    const updatedAssignment = await prisma.positionExpertiseGroup.update({
      where: { id: assignmentId },
      data: validatedData,
      include: {
        group: {
          include: {
            skills: {
              select: {
                id: true,
                name: true,
                description: true,
                maxScore: true,
                skillType: true,
                isActive: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json(updatedAssignment);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating expertise group assignment:', error);
    return NextResponse.json(
      { error: 'Failed to update expertise group assignment' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; assignmentId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { assignmentId } = await params;

    // Check if assignment exists
    const existingAssignment = await prisma.positionExpertiseGroup.findUnique({
      where: { id: assignmentId }
    });

    if (!existingAssignment) {
      return NextResponse.json(
        { error: 'Expertise group assignment not found' },
        { status: 404 }
      );
    }

    // Delete the assignment
    await prisma.positionExpertiseGroup.delete({
      where: { id: assignmentId }
    });

    return NextResponse.json({ message: 'Expertise group assignment removed successfully' });
  } catch (error) {
    console.error('Error removing expertise group assignment:', error);
    return NextResponse.json(
      { error: 'Failed to remove expertise group assignment' },
      { status: 500 }
    );
  }
}
