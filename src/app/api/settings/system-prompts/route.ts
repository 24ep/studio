export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextResponse, type NextRequest } from 'next/server';
import { hasPermission } from '@/lib/permissions';
import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';

import { auth } from '@/auth';
import { readRequestJsonResult } from '@/lib/request-json';
const systemPromptSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  content: z.string().min(1, 'Content is required'),
  categoryId: z.string().min(1, 'Category ID is required'),
  isActive: z.boolean().default(true),
});

type SystemPromptWithCategory = Prisma.SystemPromptGetPayload<{
  include: {
    category: {
      select: {
        name: true;
        color: true;
      };
    };
  };
}>;

// Function to ensure default category exists
async function ensureDefaultCategory() {
  try {
    const existingCategory = await prisma.systemPromptCategory.findFirst();
    if (!existingCategory) {
      await prisma.systemPromptCategory.create({
        data: {
          name: 'General',
          description: 'General system prompts for various use cases',
          color: '#3B82F6',
          isActive: true,
        },
      });
    }
  } catch (error) {
    console.error('Error ensuring default category exists:', error);
    // Don't throw error, just log it
  }
}

export async function GET(request: NextRequest) {
  const session = await auth();
  
  if (!session?.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  // Check if user has SYSTEM_SETTINGS_VIEW permission
  if (!hasPermission(session.user, 'SYSTEM_SETTINGS_VIEW')) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    // Ensure default category exists
    await ensureDefaultCategory();

    const systemPrompts = await prisma.systemPrompt.findMany({
      where: {
        NOT: [
          { name: { contains: 'AI Power Search', mode: 'insensitive' } },
        ],
      },
      include: {
        category: {
          select: {
            name: true,
            color: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Transform the data to match the expected format
    const transformedPrompts = systemPrompts.map((prompt: SystemPromptWithCategory) => ({
      id: prompt.id,
      name: prompt.name,
      description: prompt.description,
      content: prompt.content,
      categoryId: prompt.categoryId,
      isActive: prompt.isActive,
      createdAt: prompt.createdAt,
      updatedAt: prompt.updatedAt,
      categoryName: prompt.category.name,
      categoryColor: prompt.category.color,
    }));

    return NextResponse.json(transformedPrompts);
  } catch (error) {
    console.error('Error fetching system prompts:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  
  if (!session?.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  // Check if user has SYSTEM_SETTINGS_EDIT permission
  if (!hasPermission(session.user, 'SYSTEM_SETTINGS_EDIT')) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  const bodyResult = await readRequestJsonResult(request);
  if (!bodyResult.ok) {
    return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 });
  }

  const body = bodyResult.value;
  const validationResult = systemPromptSchema.safeParse(body);
  if (!validationResult.success) {
    return NextResponse.json({ 
      message: 'Validation failed', 
      errors: validationResult.error.flatten().fieldErrors 
    }, { status: 400 });
  }

    const validatedData = validationResult.data;
  const name = validatedData.name;
  const description = validatedData.description;
  const content = validatedData.content;
  const categoryId = validatedData.categoryId;
  const isActive = validatedData.isActive;

  try {
    // First, check if any categories exist
    const categoriesCount = await prisma.systemPromptCategory.count();
    if (categoriesCount === 0) {
      return NextResponse.json({ 
        message: 'No system prompt categories exist. Please create at least one category first.',
        error: 'No categories available'
      }, { status: 400 });
    }

    // Then, verify that the specific category exists
    const category = await prisma.systemPromptCategory.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      return NextResponse.json({ 
        message: 'Invalid category ID. Please select a valid category.',
        error: 'Category not found'
      }, { status: 400 });
    }

    // Create new system prompt
    const newSystemPrompt = await prisma.systemPrompt.create({
      data: {
        name,
        description,
        content,
        categoryId,
        isActive,
      },
    });

    return NextResponse.json(newSystemPrompt, { status: 201 });
  } catch (error) {
    console.error('Error creating system prompt:', error);
    
    // Check for specific Prisma errors
    if (error instanceof Error) {
      if (error.message.includes('Foreign key constraint failed')) {
        return NextResponse.json({ 
          message: 'Invalid category ID. Please select a valid category.',
          error: error.message 
        }, { status: 400 });
      }
      if (error.message.includes('Unique constraint failed')) {
        return NextResponse.json({ 
          message: 'A system prompt with this name already exists.',
          error: error.message 
        }, { status: 400 });
      }
    }
    
    return NextResponse.json({ 
      message: 'Internal server error', 
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
