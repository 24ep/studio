import { auth } from '@/auth';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { readRequestJsonResult } from '@/lib/request-json';
import { z } from 'zod';

const updatePersonalityTraitAssignmentSchema = z.object({
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
    const validatedData = updatePersonalityTraitAssignmentSchema.parse(body.value);

    // Check if assignment exists
    const existingAssignment = await prisma.positionPersonalityTrait.findUnique({
      where: { id: assignmentId }
    });

    if (!existingAssignment) {
      return NextResponse.json(
        { error: 'Personality trait assignment not found' },
        { status: 404 }
      );
    }

    // Update the assignment
    const updatedAssignment = await prisma.positionPersonalityTrait.update({
      where: { id: assignmentId },
      data: validatedData,
      include: {
        trait: {
          include: {
            group: {
              select: {
                id: true,
                name: true,
                color: true
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

    console.error('Error updating personality trait assignment:', error);
    return NextResponse.json(
      { error: 'Failed to update personality trait assignment' },
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
    const existingAssignment = await prisma.positionPersonalityTrait.findUnique({
      where: { id: assignmentId }
    });

    if (!existingAssignment) {
      return NextResponse.json(
        { error: 'Personality trait assignment not found' },
        { status: 404 }
      );
    }

    // Delete the assignment
    await prisma.positionPersonalityTrait.delete({
      where: { id: assignmentId }
    });

    return NextResponse.json({ message: 'Personality trait assignment removed successfully' });
  } catch (error) {
    console.error('Error removing personality trait assignment:', error);
    return NextResponse.json(
      { error: 'Failed to remove personality trait assignment' },
      { status: 500 }
    );
  }
}
