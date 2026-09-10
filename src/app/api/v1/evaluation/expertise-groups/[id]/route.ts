import { auth } from '@/auth';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { readRequestJsonResult } from '@/lib/request-json';

const updateExpertiseGroupSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format').optional()
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
    const group = await prisma.expertiseGroup.findUnique({
      where: { id },
      include: {
        skills: {
          select: {
            id: true,
            name: true,
            description: true,
            maxScore: true,
            skillType: true,
            isActive: true,
            sortOrder: true
          }
        }
      }
    });

    if (!group) {
      return NextResponse.json(
        { error: 'Expertise group not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(group);
  } catch (error) {
    console.error('Error fetching expertise group:', error);
    return NextResponse.json(
      { error: 'Failed to fetch expertise group' },
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
    const validatedData = updateExpertiseGroupSchema.parse(bodyResult.ok ? bodyResult.value : undefined);

    // Check if group exists
    const existingGroup = await prisma.expertiseGroup.findUnique({
      where: { id }
    });

    if (!existingGroup) {
      return NextResponse.json(
        { error: 'Expertise group not found' },
        { status: 404 }
      );
    }

    // If name is being updated, check for duplicates
    if (validatedData.name && validatedData.name !== existingGroup.name) {
      const duplicateGroup = await prisma.expertiseGroup.findUnique({
        where: { name: validatedData.name }
      });

      if (duplicateGroup) {
        return NextResponse.json(
          { error: 'Expertise group with this name already exists' },
          { status: 400 }
        );
      }
    }

    const updatedGroup = await prisma.expertiseGroup.update({
      where: { id },
      data: validatedData,
      include: {
        skills: {
          select: {
            id: true,
            name: true,
            description: true,
            maxScore: true,
            skillType: true,
            isActive: true,
            sortOrder: true
          }
        }
      }
    });

    return NextResponse.json(updatedGroup);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating expertise group:', error);
    return NextResponse.json(
      { error: 'Failed to update expertise group' },
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
    // Check if group exists
    const existingGroup = await prisma.expertiseGroup.findUnique({
      where: { id },
      include: { skills: true }
    });

    if (!existingGroup) {
      return NextResponse.json(
        { error: 'Expertise group not found' },
        { status: 404 }
      );
    }

    // Remove group from all skills first
    await prisma.expertiseSkill.updateMany({
      where: { groupId: id },
      data: { groupId: null }
    });

    // Delete the group
    await prisma.expertiseGroup.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Expertise group deleted successfully' });
  } catch (error) {
    console.error('Error deleting expertise group:', error);
    return NextResponse.json(
      { error: 'Failed to delete expertise group' },
      { status: 500 }
    );
  }
}
