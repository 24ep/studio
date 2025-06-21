// src/app/api/settings/custom-field-definitions/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { logAudit } from '@/lib/auditLog';

const fieldDefinitionSchema = z.object({
  model: z.enum(['Candidate', 'Position']),
  name: z.string().min(3, 'Name must be at least 3 characters').regex(/^[a-zA-Z0-9_]+$/, 'Name can only contain letters, numbers, and underscores'),
  label: z.string().min(3, 'Label must be at least 3 characters'),
  type: z.enum(['TEXT', 'TEXTAREA', 'NUMBER', 'DATE', 'BOOLEAN', 'SELECT', 'MULTISELECT']),
  options: z.array(z.string()).optional(),
  placeholder: z.string().optional(),
  defaultValue: z.string().optional(),
  isRequired: z.boolean().default(false),
  isFilterable: z.boolean().default(false),
});

// GET all custom field definitions
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'Admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const definitions = await prisma.customFieldDefinition.findMany({
      orderBy: {
        order: 'asc',
      },
    });
    return NextResponse.json(definitions);
  } catch (error) {
    console.error('Error fetching custom field definitions:', error);
    return NextResponse.json({ error: 'Failed to fetch custom field definitions' }, { status: 500 });
  }
}

// POST a new custom field definition
export async function POST(request: Request) {
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

    const { model, name, label, type, options, placeholder, defaultValue, isRequired, isFilterable } = validation.data;

    const newDefinition = await prisma.customFieldDefinition.create({
      data: {
        model,
        name,
        label,
        type,
        options: options || [],
        placeholder,
        defaultValue,
        isRequired,
        isFilterable,
        isSystemField: false, // Can only create non-system fields
      },
    });

    await logAudit('AUDIT', `Created custom field '${label}' for ${model}`, 'CustomFieldDefinition', session.user.id);

    return NextResponse.json(newDefinition, { status: 201 });
  } catch (error: any) {
    console.error('Error creating custom field definition:', error);
    if (error.code === 'P2002') { // Unique constraint violation
        const { name, model } = fieldDefinitionSchema.parse(await request.json());
        return NextResponse.json({ error: `A field with the name "${name}" already exists for the ${model} model.` }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create custom field definition' }, { status: 500 });
  }
}
