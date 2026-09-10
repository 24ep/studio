import { auth } from '@/auth';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextResponse, type NextRequest } from 'next/server';
import { hasPermission } from '@/lib/permissions';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { readRequestJsonResult } from '@/lib/request-json';

const systemPromptUpdateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  content: z.string().min(1, 'Content is required'),
  categoryId: z.string().min(1, 'Category ID is required'),
  isActive: z.boolean().default(true),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  
  if (!session?.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  // Check if user has SYSTEM_SETTINGS_VIEW permission
  if (!hasPermission(session.user, 'SYSTEM_SETTINGS_VIEW')) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;

  try {
    const systemPrompt = await prisma.systemPrompt.findUnique({
      where: { id },
    });

    if (!systemPrompt) {
      return NextResponse.json({ message: 'System prompt not found' }, { status: 404 });
    }

    return NextResponse.json(systemPrompt);
  } catch (error) {
    console.error('Error fetching system prompt:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  
  if (!session?.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  // Check if user has SYSTEM_SETTINGS_EDIT permission
  if (!hasPermission(session.user, 'SYSTEM_SETTINGS_EDIT')) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;

  const bodyResult = await readRequestJsonResult(request);
  if (!bodyResult.ok) {
    return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 });
  }

  const body = bodyResult.value;
  const validationResult = systemPromptUpdateSchema.safeParse(body);
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

    // Update the system prompt
    const updatedSystemPrompt = await prisma.systemPrompt.update({
      where: { id },
      data: {
        name,
        description,
        content,
        categoryId,
        isActive,
      },
    });

    return NextResponse.json(updatedSystemPrompt);
  } catch (error) {
    console.error('Error updating system prompt:', error);
    
    // Check for specific Prisma errors
    if (error instanceof Error) {
      if (error.message.includes('Record to update was not found')) {
        return NextResponse.json({ message: 'System prompt not found' }, { status: 404 });
      }
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  
  if (!session?.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  // Check if user has SYSTEM_SETTINGS_EDIT permission
  if (!hasPermission(session.user, 'SYSTEM_SETTINGS_EDIT')) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;

  try {
    await prisma.systemPrompt.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'System prompt deleted successfully' });
  } catch (error) {
    console.error('Error deleting system prompt:', error);
    
    // Check for specific Prisma errors
    if (error instanceof Error) {
      if (error.message.includes('Record to delete does not exist')) {
        return NextResponse.json({ message: 'System prompt not found' }, { status: 404 });
      }
    }
    
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
