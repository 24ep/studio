import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';

import { auth } from '@/auth';
import { readRequestJsonResult } from '@/lib/request-json';
import { initializeEvaluationConfigurationFromAppKit } from '@/lib/appkit-initialize-evaluation';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const createPersonalityTraitSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional().nullable(),
  shortDescription: z.string().optional().nullable(),
  groupId: z.preprocess(
    (val) => {
      if (val === '' || val === null || val === undefined) return null;
      const s = String(val);
      return UUID_REGEX.test(s) ? s : null;
    },
    z.string().uuid().nullable().optional()
  )
});

const updatePersonalityTraitSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  description: z.string().optional().nullable(),
  shortDescription: z.string().optional().nullable(),
  groupId: z.preprocess(
    (val) => {
      if (val === '' || val === null || val === undefined) return null;
      const s = String(val);
      return UUID_REGEX.test(s) ? s : null;
    },
    z.string().uuid().nullable().optional()
  ),
  isActive: z.boolean().optional()
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await initializeEvaluationConfigurationFromAppKit();
    const traits = await prisma.personalityTrait.findMany({
      include: {
        group: {
          select: {
            id: true,
            name: true,
            color: true
          }
        }
      },
      orderBy: { sortOrder: 'asc' }
    });

    return NextResponse.json(traits);
  } catch (error) {
    console.error('Error fetching personality traits:', error);
    return NextResponse.json(
      { error: 'Failed to fetch personality traits' },
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
    const validatedData = createPersonalityTraitSchema.parse(bodyResult.ok ? bodyResult.value : undefined);

    // Check if trait with same name already exists
    const existingTrait = await prisma.personalityTrait.findUnique({
      where: { name: validatedData.name }
    });

    if (existingTrait) {
      return NextResponse.json(
        { error: 'Personality trait with this name already exists' },
        { status: 400 }
      );
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

    // Get the highest sort order
    const lastTrait = await prisma.personalityTrait.findFirst({
      orderBy: { sortOrder: 'desc' }
    });

    const newTrait = await prisma.personalityTrait.create({
      data: {
        ...validatedData,
        sortOrder: (lastTrait?.sortOrder || 0) + 1
      },
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

    return NextResponse.json(newTrait, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Validation error creating personality trait:', error.errors);
      return NextResponse.json(
        { 
          error: 'Invalid input', 
          details: error.errors,
          message: error.errors[0]?.message || 'Invalid input'
        },
        { status: 400 }
      );
    }

    console.error('Error creating personality trait:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create personality trait',
        message: error instanceof Error ? error.message : 'Unknown error',
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : String(error)) : undefined
      },
      { status: 500 }
    );
  }
}
