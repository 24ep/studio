import { auth } from '@/auth';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import {
  deleteExpertiseSkill,
  expertiseGroupExists,
  findExpertiseSkill,
  findExpertiseSkillById,
  findExpertiseSkillByName,
  parseUpdateExpertiseSkillRequest,
  updateExpertiseSkill
} from '../expertise-skills-route-helpers';

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
    const skill = await findExpertiseSkill(id);

    if (!skill) {
      return NextResponse.json(
        { error: 'Expertise skill not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(skill);
  } catch (error) {
    console.error('Error fetching expertise skill:', error);
    return NextResponse.json(
      { error: 'Failed to fetch expertise skill' },
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
    const validatedData = await parseUpdateExpertiseSkillRequest(request);

    const existingSkill = await findExpertiseSkillById(id);

    if (!existingSkill) {
      return NextResponse.json(
        { error: 'Expertise skill not found' },
        { status: 404 }
      );
    }

    if (validatedData.name && validatedData.name !== existingSkill.name) {
      const duplicateSkill = await findExpertiseSkillByName(validatedData.name);

      if (duplicateSkill) {
        return NextResponse.json(
          { error: 'Expertise skill with this name already exists' },
          { status: 400 }
        );
      }
    }

    if (validatedData.groupId && !(await expertiseGroupExists(validatedData.groupId))) {
      return NextResponse.json(
        { error: 'Expertise group not found' },
        { status: 400 }
      );
    }

    const updatedSkill = await updateExpertiseSkill(id, validatedData);

    return NextResponse.json(updatedSkill);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating expertise skill:', error);
    return NextResponse.json(
      { error: 'Failed to update expertise skill' },
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
    const existingSkill = await findExpertiseSkillById(id);

    if (!existingSkill) {
      return NextResponse.json(
        { error: 'Expertise skill not found' },
        { status: 404 }
      );
    }

    await deleteExpertiseSkill(id);

    return NextResponse.json({ message: 'Expertise skill deleted successfully' });
  } catch (error) {
    console.error('Error deleting expertise skill:', error);
    return NextResponse.json(
      { error: 'Failed to delete expertise skill' },
      { status: 500 }
    );
  }
}
