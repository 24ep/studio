// src/app/api/settings/custom-field-definitions/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import pool from '../../../../lib/db';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import type { CustomFieldDefinition, CustomFieldType } from '@/lib/types';
import { CUSTOM_FIELD_TYPES } from '@/lib/types';
import { logAudit } from '@/lib/auditLog';

const customFieldOptionSchema = z.object({
  value: z.string().min(1),
  label: z.string().min(1),
});

const createCustomFieldDefinitionSchema = z.object({
  model_name: z.enum(['Candidate', 'Position']),
  field_key: z.string().min(1, "Field key is required").regex(/^[a-z0-9_]+$/, "Field key must be lowercase alphanumeric with underscores."),
  label: z.string().min(1, "Label is required"),
  field_type: z.enum(CUSTOM_FIELD_TYPES as [CustomFieldType, ...CustomFieldType[]]),
  options: z.array(customFieldOptionSchema).optional().nullable(),
  is_required: z.boolean().optional().default(false),
  sort_order: z.number().int().optional().default(0),
});

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
   if (session?.user?.role !== 'Admin' && !session?.user?.modulePermissions?.includes('CUSTOM_FIELDS_MANAGE')) {
    return NextResponse.json({ message: "Forbidden: Insufficient permissions" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const modelName = searchParams.get('model_name');

    let query = 'SELECT * FROM "CustomFieldDefinition"';
    const queryParams = [];
    if (modelName && ['Candidate', 'Position'].includes(modelName)) {
      query += ' WHERE model_name = $1';
      queryParams.push(modelName);
    }
    query += ' ORDER BY model_name ASC, sort_order ASC, label ASC';
    
    const result = await pool.query(query, queryParams);
    return NextResponse.json(result.rows, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch custom field definitions:", error);
    await logAudit('ERROR', `Failed to fetch custom field definitions. Error: ${(error as Error).message}`, 'API:CustomFields:Get', session?.user?.id);
    return NextResponse.json({ message: "Error fetching custom field definitions", error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'Admin' && !session?.user?.modulePermissions?.includes('CUSTOM_FIELDS_MANAGE')) {
    await logAudit('WARN', `Forbidden attempt to create custom field definition by user ${session?.user?.email || 'Unknown'}.`, 'API:CustomFields:Create', session?.user?.id);
    return NextResponse.json({ message: "Forbidden: Insufficient permissions" }, { status: 403 });
  }

  let body;
  try {
    body = await request.json();
  } catch (error) {
    return NextResponse.json({ message: "Error parsing request body", error: (error as Error).message }, { status: 400 });
  }

  const validationResult = createCustomFieldDefinitionSchema.safeParse(body);
  if (!validationResult.success) {
    return NextResponse.json(
      { message: "Invalid input", errors: validationResult.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { model_name, field_key, label, field_type, options, is_required, sort_order } = validationResult.data;

  if (['select_single', 'select_multiple'].includes(field_type) && (!options || options.length === 0)) {
    return NextResponse.json({ message: "Options are required for select field types." }, { status: 400 });
  }
  if (!['select_single', 'select_multiple'].includes(field_type) && options && options.length > 0) {
    return NextResponse.json({ message: "Options should only be provided for select field types." }, { status: 400 });
  }


  try {
    const newFieldId = uuidv4();
    const insertQuery = `
      INSERT INTO "CustomFieldDefinition" (id, model_name, field_key, label, field_type, options, is_required, sort_order, "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      RETURNING *;
    `;
    const result = await pool.query(insertQuery, [
      newFieldId,
      model_name,
      field_key,
      label,
      field_type,
      options ? JSON.stringify(options) : null,
      is_required,
      sort_order
    ]);
    const newField = result.rows[0];

    await logAudit('AUDIT', `Custom field definition '${label}' (Key: ${field_key}) for model '${model_name}' created by ${session.user.name}.`, 'API:CustomFields:Create', session.user.id, { fieldId: newField.id, model: model_name, key: field_key });
    return NextResponse.json(newField, { status: 201 });
  } catch (error: any) {
    console.error("Failed to create custom field definition:", error);
    if (error.code === '23505' && error.constraint === 'CustomFieldDefinition_model_name_field_key_key') { // Constraint name from DB
      await logAudit('WARN', `Attempt to create custom field with duplicate key '${field_key}' for model '${model_name}' by ${session.user.name}.`, 'API:CustomFields:Create', session.user.id, { model: model_name, key: field_key });
      return NextResponse.json({ message: `A custom field with key "${field_key}" already exists for model "${model_name}".` }, { status: 409 });
    }
    await logAudit('ERROR', `Failed to create custom field definition '${label}' by ${session.user.name}. Error: ${error.message}`, 'API:CustomFields:Create', session.user.id, { model: model_name, key: field_key, label });
    return NextResponse.json({ message: "Error creating custom field definition", error: error.message }, { status: 500 });
  }
}
