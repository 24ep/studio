// src/app/api/settings/custom-field-definitions/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { getPool } from '@/lib/db';
import { logAudit } from '@/lib/auditLog';
import { getServerSession } from 'next-auth/next';
import { v4 as uuidv4 } from 'uuid';
import type { CustomFieldType } from '@/lib/types';
import { authOptions } from '@/lib/auth';

export const dynamic = "force-dynamic";

const createCustomFieldSchema = z.object({
  model: z.enum(['Candidate', 'Position']),
  name: z.string().min(1, "Field name is required"),
  label: z.string().min(1, "Label is required"),
  type: z.enum(['TEXT', 'TEXTAREA', 'NUMBER', 'DATE', 'BOOLEAN', 'SELECT', 'MULTISELECT']),
  options: z.array(z.string()).optional().nullable(),
  placeholder: z.string().optional().nullable(),
  defaultValue: z.string().optional().nullable(),
  isRequired: z.boolean().default(false),
  isFilterable: z.boolean().default(false),
});

const updateCustomFieldSchema = createCustomFieldSchema.partial().omit({ model: true, name: true });

/**
 * @openapi
 * /api/settings/custom-field-definitions:
 *   get:
 *     summary: Get custom field definitions
 *     description: Returns all custom field definitions for candidates or positions. Requires authentication.
 *     parameters:
 *       - in: query
 *         name: model
 *         schema:
 *           type: string
 *           enum: [Candidate, Position]
 *         description: Filter by model name (Candidate or Position)
 *     responses:
 *       200:
 *         description: List of custom field definitions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 *   post:
 *     summary: Create a custom field definition
 *     description: Creates a new custom field definition. Requires Admin or CUSTOM_FIELDS_MANAGE permission.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               model:
 *                 type: string
 *                 enum: [Candidate, Position]
 *               name:
 *                 type: string
 *               label:
 *                 type: string
 *               type:
 *                 type: string
 *               options:
 *                 type: array
 *                 items:
 *                   type: string
 *               isRequired:
 *                 type: boolean
 *               isFilterable:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Custom field definition created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (insufficient permissions)
 *       500:
 *         description: Server error
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const modelName = searchParams.get('model') as 'Candidate' | 'Position' | null;

  try {
    let query = `
      SELECT 
        id, model_name, field_key, label, field_type, options, 
        is_required, sort_order, "createdAt", "updatedAt"
      FROM "CustomFieldDefinition"
    `;
    const queryParams: any[] = [];

    if (modelName) {
      query += ' WHERE model_name = $1';
      queryParams.push(modelName);
    }

    query += ' ORDER BY sort_order ASC, label ASC';

    const result = await getPool().query(query, queryParams);
    
    // Map DB fields to frontend expected fields
    const mappedRows = result.rows.map(row => ({
      id: row.id,
      model: row.model_name,
      name: row.field_key,
      label: row.label,
      type: row.field_type,
      options: row.options || [],
      placeholder: null,
      defaultValue: null,
      isRequired: row.is_required,
      isFilterable: false,
      isSystemField: false,
      order: row.sort_order ?? 0,
    }));
    return NextResponse.json(mappedRows, { status: 200 });
  } catch (error: any) {
    console.error("Failed to fetch custom field definitions:", error);
    await logAudit('ERROR', `Failed to fetch custom field definitions. Error: ${error.message}`, 'API:CustomFields:GetAll', session.user.id);
    return NextResponse.json({ message: "Error fetching custom field definitions", error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== 'Admin' && !session.user.modulePermissions?.includes('CUSTOM_FIELDS_MANAGE')) {
    await logAudit('WARN', `Forbidden attempt to create custom field by ${session.user.name}.`, 'API:CustomFields:Create', session.user.id);
    return NextResponse.json({ message: "Forbidden: Insufficient permissions" }, { status: 403 });
  }

  let body;
  try {
    body = await request.json();
  } catch (error: any) {
    return NextResponse.json({ message: "Error parsing request body", error: error.message }, { status: 400 });
  }

  const validationResult = createCustomFieldSchema.safeParse(body);
  if (!validationResult.success) {
    return NextResponse.json({ 
      message: "Invalid input", 
      errors: validationResult.error.flatten().fieldErrors 
    }, { status: 400 });
  }

  const { model, name, label, type, options, placeholder, defaultValue, isRequired, isFilterable } = validationResult.data;

  try {
    // Check if field name already exists for this model
    const existingField = await getPool().query(
      'SELECT id FROM "CustomFieldDefinition" WHERE model_name = $1 AND field_key = $2',
      [model, name]
    );

    if (existingField.rows.length > 0) {
      return NextResponse.json({ 
        message: `A custom field with name "${name}" already exists for ${model}` 
      }, { status: 409 });
    }

    const newFieldId = uuidv4();
    const insertQuery = `
      INSERT INTO "CustomFieldDefinition" (
        id, model_name, field_key, label, field_type, options, 
        is_required, sort_order, "createdAt", "updatedAt"
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      RETURNING *;
    `;

    const result = await getPool().query(insertQuery, [
      newFieldId, model, name, label, type, 
      options || null, isRequired, 0
    ]);

    const newField = result.rows[0];

    await logAudit('AUDIT', 
      `Custom field "${label}" (${name}) created for ${model} by ${session.user.name}.`, 
      'API:CustomFields:Create', 
      session.user.id, 
      { fieldId: newFieldId, modelName: model, fieldKey: name, fieldType: type }
    );

    // Return in the format expected by frontend
    return NextResponse.json({
      id: newField.id,
      model: newField.model_name,
      name: newField.field_key,
      label: newField.label,
      type: newField.field_type,
      options: newField.options || [],
      placeholder: null,
      defaultValue: null,
      isRequired: newField.is_required,
      isFilterable: false,
      isSystemField: false,
      order: newField.sort_order ?? 0,
    }, { status: 201 });
  } catch (error: any) {
    console.error("Failed to create custom field definition:", error);
    await logAudit('ERROR', 
      `Failed to create custom field definition. Error: ${error.message}`, 
      'API:CustomFields:Create', 
      session.user.id, 
      { input: body }
    );
    return NextResponse.json({ message: "Error creating custom field definition", error: error.message }, { status: 500 });
  }
}
