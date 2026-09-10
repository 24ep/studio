import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';

import { auth } from '@/auth';
import { readRequestJsonResult } from '@/lib/request-json';
import { initializeEvaluationConfigurationFromAppKit } from '@/lib/appkit-initialize-evaluation';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const createExpertiseGroupSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format').optional().default('#3B82F6')
});

const updateExpertiseGroupSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format').optional()
});

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function getErrorCode(error: unknown): string | undefined {
  if (!error || typeof error !== 'object' || !('code' in error)) {
    return undefined;
  }

  const code = error.code;
  return typeof code === 'string' ? code : undefined;
}

function getErrorStatus(error: unknown): number {
  if (!error || typeof error !== 'object' || !('status' in error)) {
    return 500;
  }

  const status = error.status;
  return typeof status === 'number' ? status : 500;
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await initializeEvaluationConfigurationFromAppKit();
    const groups = await prisma.expertiseGroup.findMany({
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
      },
      orderBy: { sortOrder: 'asc' }
    });

    return NextResponse.json(groups);
  } catch (error) {
    console.error('Error fetching expertise groups:', error);
    return NextResponse.json(
      { error: 'Failed to fetch expertise groups' },
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
    const validatedData = createExpertiseGroupSchema.parse(bodyResult.ok ? bodyResult.value : undefined);

    // Check if group with same name already exists
    const existingGroup = await prisma.expertiseGroup.findUnique({
      where: { name: validatedData.name }
    });

    if (existingGroup) {
      return NextResponse.json(
        { error: 'Expertise group with this name already exists' },
        { status: 400 }
      );
    }

    // Get the highest sort order
    const lastGroup = await prisma.expertiseGroup.findFirst({
      orderBy: { sortOrder: 'desc' }
    });

    const newGroup = await prisma.expertiseGroup.create({
      data: {
        ...validatedData,
        sortOrder: (lastGroup?.sortOrder || 0) + 1
      },
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

    return NextResponse.json(newGroup, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Validation error creating expertise group:', error.errors);
      return NextResponse.json(
        { 
          error: 'Invalid input', 
          details: error.errors,
          message: error.errors[0]?.message || 'Invalid input'
        },
        { status: 400 }
      );
    }

    // Handle Prisma errors
    if (getErrorCode(error) === 'P2002') {
      return NextResponse.json(
        { error: 'An expertise group with this name already exists' },
        { status: 400 }
      );
    }

    console.error('Error creating expertise group:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create expertise group',
        message: getErrorMessage(error),
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : String(error)) : undefined
      },
      { status: getErrorStatus(error) }
    );
  }
}
