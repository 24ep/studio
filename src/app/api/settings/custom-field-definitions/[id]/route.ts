// src/app/api/settings/custom-field-definitions/[id]/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { logAudit } from '@/lib/auditLog';

const fieldDefinitionSchema = z.object({
  label: z.string().min(3, 'Label must be at least 3 characters').optional(),
  type: z.enum(['TEXT', 'TEXTAREA', 'NUMBER', 'DATE', 'BOOLEAN', 'SELECT', 'MULTISELECT']).optional(),
  options: z.array(z.string()).optional(),
  placeholder: z.string().optional(),
  defaultValue: z.string().optional(),
  isRequired: z.boolean().optional(),
  isFilterable: z.boolean().optional(),
  order: z.number().int().optional(),
});

// GET a single custom field definition by ID
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'Admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const definition = await prisma.customFieldDefinition.findUnique({
      where: { id: params.id },
    });

    if (!definition) {
      return NextResponse.json({ error: 'Custom field definition not found' }, { status: 404 });
    }

    return NextResponse.json(definition);
  } catch (error) {
    console.error(`Error fetching custom field definition ${params.id}:`, error);
    return NextResponse.json({ error: 'Failed to fetch custom field definition' }, { status: 500 });
  }
}

// PUT (update) a custom field definition
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'Admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const validation = fieldDefinitionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid input', details: validation.error.errors }, { status: 400 });
    }

    const fieldToUpdate = await prisma.customFieldDefinition.findUnique({
        where: { id: params.id },
    });

    if (!fieldToUpdate) {
        return NextResponse.json({ error: 'Custom field definition not found' }, { status: 404 });
    }

    if (fieldToUpdate.isSystemField) {
        return NextResponse.json({ error: 'System fields cannot be fully updated.' }, { status: 400 });
    }

    const updatedDefinition = await prisma.customFieldDefinition.update({
      where: { id: params.id },
      data: validation.data,
    });

    await logAudit('AUDIT', `Updated custom field '${updatedDefinition.label}' for ${updatedDefinition.model}`, 'CustomFieldDefinition', session.user.id);

    return NextResponse.json(updatedDefinition);
  } catch (error) {
    console.error(`Error updating custom field definition ${params.id}:`, error);
    return NextResponse.json({ error: 'Failed to update custom field definition' }, { status: 500 });
  }
}

// DELETE a custom field definition
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'Admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const fieldToDelete = await prisma.customFieldDefinition.findUnique({
        where: { id: params.id },
    });

    if (!fieldToDelete) {
        return NextResponse.json({ error: 'Custom field definition not found' }, { status: 404 });
    }

    if (fieldToDelete.isSystemField) {
        return NextResponse.json({ error: 'System fields cannot be deleted.' }, { status: 400 });
    }

    // Note: Deleting a definition does not automatically remove the data from the customAttributes JSON blobs.
    // A cleanup job could be implemented for that if needed.

    const deletedDefinition = await prisma.customFieldDefinition.delete({
      where: { id: params.id },
    });

    await logAudit('AUDIT', `Deleted custom field '${deletedDefinition.label}' from ${deletedDefinition.model}`, 'CustomFieldDefinition', session.user.id);

    return NextResponse.json({ message: 'Custom field definition deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error(`Error deleting custom field definition ${params.id}:`, error);
    return NextResponse.json({ error: 'Failed to delete custom field definition' }, { status: 500 });
  }
}
