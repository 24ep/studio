export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextResponse, type NextRequest } from 'next/server';
import { hasPermission } from '@/lib/permissions';
import { z } from 'zod';
import prisma from '@/lib/prisma';

import { auth } from '@/auth';
import { readRequestJsonResult } from '@/lib/request-json';
const categorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  color: z.string().optional(),
  isActive: z.boolean().default(true),
});

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

    const categories = await prisma.systemPromptCategory.findMany({
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error fetching system prompt categories:', error);
    
    return NextResponse.json({ 
      message: 'Internal server error', 
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
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
  const validationResult = categorySchema.safeParse(body);
  if (!validationResult.success) {
    return NextResponse.json({ 
      message: 'Validation failed', 
      errors: validationResult.error.flatten().fieldErrors 
    }, { status: 400 });
  }

  const validatedData = validationResult.data;
  const name = validatedData.name;
  const description = validatedData.description;
  const color = validatedData.color;
  const isActive = validatedData.isActive;

  try {
    // Check if category with this name already exists
    const existingCategory = await prisma.systemPromptCategory.findUnique({
      where: { name },
    });

    if (existingCategory) {
      return NextResponse.json({ 
        message: 'A category with this name already exists.',
        error: 'Duplicate category name'
      }, { status: 400 });
    }

    // Create new category
    const newCategory = await prisma.systemPromptCategory.create({
      data: {
        name,
        description,
        color,
        isActive,
      },
    });

    return NextResponse.json(newCategory, { status: 201 });
  } catch (error) {
    console.error('Error creating system prompt category:', error);
    
    return NextResponse.json({ 
      message: 'Internal server error', 
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
