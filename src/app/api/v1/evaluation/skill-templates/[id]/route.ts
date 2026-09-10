import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import { getJsonArray, getJsonString } from '@/lib/json-types';
import { readRequestJsonObject } from '@/lib/request-json';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET /api/v1/evaluation/skill-templates/[id] - Get specific skill template
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
    const template = await prisma.skillTemplate.findUnique({
      where: { id },
      include: {
        templateGroups: {
          include: {
            group: true
          }
        },
        templateSkills: {
          include: {
            skill: true
          }
        },
        templatePersonalityGroups: {
          include: {
            group: true
          }
        },
        templatePersonalityTraits: {
          include: {
            trait: true
          }
        }
      }
    });

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(template);
  } catch (error) {
    console.error('Error fetching skill template:', error);
    return NextResponse.json(
      { error: 'Failed to fetch skill template' },
      { status: 500 }
    );
  }
}

// PUT /api/v1/evaluation/skill-templates/[id] - Update skill template
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await readRequestJsonObject(request);
    const name = getJsonString(body, 'name');
    const description = getJsonString(body, 'description');
    const groupIds = getJsonArray(body, 'groupIds')?.filter((id): id is string => typeof id === 'string') ?? [];
    const skillIds = getJsonArray(body, 'skillIds')?.filter((id): id is string => typeof id === 'string') ?? [];
    const personalityGroupIds = getJsonArray(body, 'personalityGroupIds')?.filter((id): id is string => typeof id === 'string') ?? [];
    const personalityTraitIds = getJsonArray(body, 'personalityTraitIds')?.filter((id): id is string => typeof id === 'string') ?? [];

    if (!name) {
      return NextResponse.json(
        { error: 'Template name is required' },
        { status: 400 }
      );
    }

    // Check if template exists
    const { id } = await params;
    const existingTemplate = await prisma.skillTemplate.findUnique({
      where: { id }
    });

    if (!existingTemplate) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    // Update template with new assignments
    const template = await prisma.skillTemplate.update({
      where: { id },
      data: {
        name,
        description,
        templateGroups: {
          deleteMany: {},
          create: groupIds.map((groupId: string) => ({
            groupId
          }))
        },
        templateSkills: {
          deleteMany: {},
          create: skillIds.map((skillId: string) => ({
            skillId
          }))
        },
        templatePersonalityGroups: {
          deleteMany: {},
          create: personalityGroupIds.map((groupId: string) => ({
            groupId
          }))
        },
        templatePersonalityTraits: {
          deleteMany: {},
          create: personalityTraitIds.map((traitId: string) => ({
            traitId
          }))
        }
      },
      include: {
        templateGroups: {
          include: {
            group: true
          }
        },
        templateSkills: {
          include: {
            skill: true
          }
        },
        templatePersonalityGroups: {
          include: {
            group: true
          }
        },
        templatePersonalityTraits: {
          include: {
            trait: true
          }
        }
      }
    });

    return NextResponse.json(template);
  } catch (error) {
    console.error('Error updating skill template:', error);
    return NextResponse.json(
      { error: 'Failed to update skill template' },
      { status: 500 }
    );
  }
}

// DELETE /api/v1/evaluation/skill-templates/[id] - Delete skill template
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if template exists
    const { id } = await params;
    const existingTemplate = await prisma.skillTemplate.findUnique({
      where: { id }
    });

    if (!existingTemplate) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    await prisma.skillTemplate.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Error deleting skill template:', error);
    return NextResponse.json(
      { error: 'Failed to delete skill template' },
      { status: 500 }
    );
  }
}
