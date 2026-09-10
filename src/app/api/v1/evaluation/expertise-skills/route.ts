export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { auth } from '@/auth';
import {
  createExpertiseSkill,
  expertiseGroupExists,
  findExpertiseSkillByName,
  listExpertiseSkills,
  parseCreateExpertiseSkillRequest
} from './expertise-skills-route-helpers';
import { initializeEvaluationConfigurationFromAppKit } from '@/lib/appkit-initialize-evaluation';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await initializeEvaluationConfigurationFromAppKit();
    const skills = await listExpertiseSkills();

    return NextResponse.json(skills);
  } catch (error) {
    console.error('Error fetching expertise skills:', error);
    return NextResponse.json(
      { error: 'Failed to fetch expertise skills' },
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

    const validatedData = await parseCreateExpertiseSkillRequest(request);

    const existingSkill = await findExpertiseSkillByName(validatedData.name);

    if (existingSkill) {
      return NextResponse.json(
        { error: 'Expertise skill with this name already exists' },
        { status: 400 }
      );
    }

    if (validatedData.groupId && !(await expertiseGroupExists(validatedData.groupId))) {
      return NextResponse.json(
        { error: 'Expertise group not found' },
        { status: 400 }
      );
    }

    const newSkill = await createExpertiseSkill(validatedData);

    return NextResponse.json(newSkill, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Validation error creating expertise skill:', error.errors);
      return NextResponse.json(
        { 
          error: 'Invalid input', 
          details: error.errors,
          message: error.errors[0]?.message || 'Invalid input'
        },
        { status: 400 }
      );
    }

    console.error('Error creating expertise skill:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create expertise skill',
        message: error instanceof Error ? error.message : 'Unknown error',
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : String(error)) : undefined
      },
      { status: 500 }
    );
  }
}
