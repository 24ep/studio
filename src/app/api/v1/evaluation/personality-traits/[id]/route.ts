import { auth } from '@/auth';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { readRequestJsonResult } from '@/lib/request-json';

const updatePersonalityTraitSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  description: z.string().optional().nullable(),
  shortDescription: z.string().optional().nullable(),
  groupId: z.string().uuid().optional().nullable(),
  isActive: z.boolean().optional()
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const trait = await prisma.personalityTrait.findUnique({
      where: { id },
      include: {
        group: {
          select: {
            id: true,
            name: true,
            color: true
          }
        }
      }
    });

    if (!trait) {
      return NextResponse.json(
        { error: 'Personality trait not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(trait);
  } catch (error) {
    console.error('Error fetching personality trait:', error);
    return NextResponse.json(
      { error: 'Failed to fetch personality trait' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const bodyResult = await readRequestJsonResult(request);
    const validatedData = updatePersonalityTraitSchema.parse(bodyResult.ok ? bodyResult.value : undefined);

    // Check if trait exists
    const existingTrait = await prisma.personalityTrait.findUnique({
      where: { id }
    });

    if (!existingTrait) {
      return NextResponse.json(
        { error: 'Personality trait not found' },
        { status: 404 }
      );
    }

    // If name is being updated, check for duplicates
    if (validatedData.name && validatedData.name !== existingTrait.name) {
      const duplicateTrait = await prisma.personalityTrait.findUnique({
        where: { name: validatedData.name }
      });

      if (duplicateTrait) {
        return NextResponse.json(
          { error: 'Personality trait with this name already exists' },
          { status: 400 }
        );
      }
    }

    // If groupId is provided, verify the group exists
    if (validatedData.groupId) {
      const group = await prisma.personalityGroup.findUnique({
        where: { id: validatedData.groupId }
      });

      if (!group) {
        return NextResponse.json(
          { error: 'Personality group not found' },
          { status: 400 }
        );
      }
    }

    const updatedTrait = await prisma.personalityTrait.update({
      where: { id },
      data: validatedData,
      include: {
        group: {
          select: {
            id: true,
            name: true,
            color: true
          }
        }
      }
    });

    return NextResponse.json(updatedTrait);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating personality trait:', error);
    return NextResponse.json(
      { error: 'Failed to update personality trait' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    // Check if trait exists
    const existingTrait = await prisma.personalityTrait.findUnique({
      where: { id }
    });

    if (!existingTrait) {
      return NextResponse.json(
        { error: 'Personality trait not found' },
        { status: 404 }
      );
    }

    // Delete the trait
    await prisma.personalityTrait.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Personality trait deleted successfully' });
  } catch (error) {
    console.error('Error deleting personality trait:', error);
    return NextResponse.json(
      { error: 'Failed to delete personality trait' },
      { status: 500 }
    );
  }
}
