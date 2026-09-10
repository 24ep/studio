import { auth } from '@/auth';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { readRequestJsonResult } from '@/lib/request-json';
import { z } from 'zod';

const assignExpertiseSkillSchema = z.object({
  skillId: z.string().uuid(),
  isRequired: z.boolean().default(false),
  weight: z.number().min(0).max(10).default(1.0),
  minScore: z.number().min(0).optional()
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
    const validatedData = assignExpertiseSkillSchema.parse(body.value);

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

    // Check if expertise skill exists
    const expertiseSkill = await prisma.expertiseSkill.findUnique({
      where: { id: validatedData.skillId }
    });

    if (!expertiseSkill) {
      return NextResponse.json(
        { error: 'Expertise skill not found' },
        { status: 404 }
      );
    }

    // Check if assignment already exists
    const existingAssignment = await prisma.positionExpertiseSkill.findUnique({
      where: {
        positionId_skillId: {
          positionId,
          skillId: validatedData.skillId
        }
      }
    });

    if (existingAssignment) {
      return NextResponse.json(
        { error: 'Expertise skill already assigned to this position' },
        { status: 400 }
      );
    }

    // Create the assignment
    const assignment = await prisma.positionExpertiseSkill.create({
      data: {
        positionId,
        skillId: validatedData.skillId,
        isRequired: validatedData.isRequired,
        weight: validatedData.weight,
        minScore: validatedData.minScore
      },
      include: {
        skill: {
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

    return NextResponse.json(assignment, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error assigning expertise skill to position:', error);
    return NextResponse.json(
      { error: 'Failed to assign expertise skill to position' },
      { status: 500 }
    );
  }
}
