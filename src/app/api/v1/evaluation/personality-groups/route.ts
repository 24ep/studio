export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';

import { auth } from '@/auth';
import { readRequestJsonResult } from '@/lib/request-json';
import { initializeEvaluationConfigurationFromAppKit } from '@/lib/appkit-initialize-evaluation';
const createPersonalityGroupSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format').optional().default('#10B981')
});

const updatePersonalityGroupSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format').optional()
});

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await initializeEvaluationConfigurationFromAppKit();
    const groups = await prisma.personalityGroup.findMany({
      include: {
        traits: {
          select: {
            id: true,
            name: true,
            description: true,
            isActive: true,
            sortOrder: true
          }
        }
      },
      orderBy: { sortOrder: 'asc' }
    });

    return NextResponse.json(groups);
  } catch (error) {
    console.error('Error fetching personality groups:', error);
    return NextResponse.json(
      { error: 'Failed to fetch personality groups' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const bodyResult = await readRequestJsonResult(request);
    const validatedData = createPersonalityGroupSchema.parse(bodyResult.ok ? bodyResult.value : undefined);

    // Check if group with same name already exists
    const existingGroup = await prisma.personalityGroup.findUnique({
      where: { name: validatedData.name }
    });

    if (existingGroup) {
      return NextResponse.json(
        { error: 'Personality group with this name already exists' },
        { status: 400 }
      );
    }

    // Get the highest sort order
    const lastGroup = await prisma.personalityGroup.findFirst({
      orderBy: { sortOrder: 'desc' }
    });

    const newGroup = await prisma.personalityGroup.create({
      data: {
        ...validatedData,
        sortOrder: (lastGroup?.sortOrder || 0) + 1
      },
      include: {
        traits: {
          select: {
            id: true,
            name: true,
            description: true,
            isActive: true,
            sortOrder: true
          }
        }
      }
    });

    return NextResponse.json(newGroup, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating personality group:', error);
    return NextResponse.json(
      { error: 'Failed to create personality group' },
      { status: 500 }
    );
  }
}
