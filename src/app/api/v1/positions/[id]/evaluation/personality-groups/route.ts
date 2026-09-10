import { auth } from '@/auth';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { readRequestJsonResult } from '@/lib/request-json';
import { z } from 'zod';

const assignPersonalityGroupSchema = z.object({
  groupId: z.string().uuid(),
  isRequired: z.boolean().default(false),
  weight: z.number().min(0).max(10).default(1.0)
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const positionId = (await params).id;
    const body = await readRequestJsonResult(request);
    if (!body.ok) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    const validatedData = assignPersonalityGroupSchema.parse(body.value);

    // Check if position exists
    const position = await prisma.position.findUnique({
      where: { id: positionId }
    });

    if (!position) {
      return NextResponse.json(
        { error: 'Position not found' },
        { status: 404 }
      );
    }

    // Check if personality group exists
    const personalityGroup = await prisma.personalityGroup.findUnique({
      where: { id: validatedData.groupId }
    });

    if (!personalityGroup) {
      return NextResponse.json(
        { error: 'Personality group not found' },
        { status: 404 }
      );
    }

    // Check if assignment already exists
    const existingAssignment = await prisma.positionPersonalityGroup.findUnique({
      where: {
        positionId_groupId: {
          positionId,
          groupId: validatedData.groupId
        }
      }
    });

    if (existingAssignment) {
      return NextResponse.json(
        { error: 'Personality group already assigned to this position' },
        { status: 400 }
      );
    }

    // Create the assignment
    const assignment = await prisma.positionPersonalityGroup.create({
      data: {
        positionId,
        groupId: validatedData.groupId,
        isRequired: validatedData.isRequired,
        weight: validatedData.weight
      },
      include: {
        group: {
          include: {
            traits: {
              select: {
                id: true,
                name: true,
                description: true,
                isActive: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json(assignment, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error assigning personality group to position:', error);
    return NextResponse.json(
      { error: 'Failed to assign personality group to position' },
      { status: 500 }
    );
  }
}
