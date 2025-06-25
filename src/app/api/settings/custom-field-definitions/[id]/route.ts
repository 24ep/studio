// src/app/api/settings/custom-field-definitions/[id]/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { getPool } from '@/lib/db';
import { logAudit } from '@/lib/auditLog';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export const dynamic = "force-dynamic";

const customFieldOptionSchema = z.object({
  value: z.string(),
  label: z.string(),
});

const updateCustomFieldSchema = z.object({
  label: z.string().min(1, "Label is required").optional(),
  field_type: z.enum(['text', 'textarea', 'number', 'boolean', 'date', 'select_single', 'select_multiple'] as const).optional(),
  options: z.array(customFieldOptionSchema).optional().nullable(),
  is_required: z.boolean().optional(),
  sort_order: z.number().optional(),
});

function extractIdFromUrl(request: NextRequest): string | null {
  const match = request.nextUrl.pathname.match(/\/custom-field-definitions\/([^/]+)/);
  return match ? match[1] : null;
}

/**
 * @openapi
 * /api/settings/custom-field-definitions/{id}:
 *   get:
 *     summary: Get a custom field definition by ID
 *     description: Returns a single custom field definition. Requires authentication.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the custom field definition
 *     responses:
 *       200:
 *         description: Custom field definition found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Not found
 *       500:
 *         description: Server error
 */
export async function GET(request: NextRequest) {
  const id = extractIdFromUrl(request);
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (!id) {
    return NextResponse.json({ message: "Field ID is required" }, { status: 400 });
  }

  try {
    const query = `
      SELECT 
        id, model_name, field_key, label, field_type, options, 
        is_required, sort_order, "createdAt", "updatedAt"
      FROM "CustomFieldDefinition"
      WHERE id = $1
    `;
    
    const result = await getPool().query(query, [id]);
    
    if (result.rows.length === 0) {
      return NextResponse.json({ message: "Custom field definition not found" }, { status: 404 });
    }

    return NextResponse.json(result.rows[0], { status: 200 });
  } catch (error: any) {
    console.error(`Failed to fetch custom field definition ${id}:`, error);
    await logAudit('ERROR', `Failed to fetch custom field definition (ID: ${id}). Error: ${error.message}`, 'API:CustomFields:GetById', session.user.id);
    return NextResponse.json({ message: "Error fetching custom field definition", error: error.message }, { status: 500 });
  }
}

/**
 * @openapi
 * /api/settings/custom-field-definitions/{id}:
 *   put:
 *     summary: Update a custom field definition by ID
 *     description: Updates a custom field definition. Requires Admin or CUSTOM_FIELDS_MANAGE permission.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the custom field definition
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Custom field definition updated
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
 *       404:
 *         description: Not found
 *       500:
 *         description: Server error
 */
export async function PUT(request: NextRequest) {
  const id = extractIdFromUrl(request);
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== 'Admin' && !session.user.modulePermissions?.includes('CUSTOM_FIELDS_MANAGE')) {
    await logAudit('WARN', `Forbidden attempt to update custom field by ${session.user.name}.`, 'API:CustomFields:Update', session.user.id);
    return NextResponse.json({ message: "Forbidden: Insufficient permissions" }, { status: 403 });
  }

  if (!id) {
    return NextResponse.json({ message: "Field ID is required" }, { status: 400 });
  }

  let body;
  try {
    body = await request.json();
  } catch (error: any) {
    return NextResponse.json({ message: "Error parsing request body", error: error.message }, { status: 400 });
  }

  const validationResult = updateCustomFieldSchema.safeParse(body);
  if (!validationResult.success) {
    return NextResponse.json({ 
      message: "Invalid input", 
      errors: validationResult.error.flatten().fieldErrors 
    }, { status: 400 });
  }

  const updateData = validationResult.data;

  try {
    // Check if field exists
    const existingField = await getPool().query(
      'SELECT * FROM "CustomFieldDefinition" WHERE id = $1',
      [id]
    );

    if (existingField.rows.length === 0) {
      return NextResponse.json({ message: "Custom field definition not found" }, { status: 404 });
    }

    const existingFieldData = existingField.rows[0];

    // Build update query dynamically
    const updateFields: string[] = [];
    const updateValues: any[] = [];
    let paramIndex = 1;

    Object.entries(updateData).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields.push(`"${key}" = $${paramIndex++}`);
        updateValues.push(value);
      }
    });

    if (updateFields.length === 0) {
      return NextResponse.json({ message: "No fields to update" }, { status: 400 });
    }

    updateFields.push(`"updatedAt" = NOW()`);
    updateValues.push(id);

    const updateQuery = `
      UPDATE "CustomFieldDefinition" 
      SET ${updateFields.join(', ')} 
      WHERE id = $${paramIndex} 
      RETURNING *;
    `;

    const result = await getPool().query(updateQuery, updateValues);
    const updatedField = result.rows[0];

    await logAudit('AUDIT', 
      `Custom field "${updatedField.label}" (${updatedField.field_key}) updated by ${session.user.name}.`, 
      'API:CustomFields:Update', 
      session.user.id, 
      { fieldId: id, changes: Object.keys(updateData) }
    );

    return NextResponse.json(updatedField, { status: 200 });
  } catch (error: any) {
    console.error(`Failed to update custom field definition ${id}:`, error);
    await logAudit('ERROR', 
      `Failed to update custom field definition (ID: ${id}). Error: ${error.message}`, 
      'API:CustomFields:Update', 
      session.user.id, 
      { fieldId: id, input: body }
    );
    return NextResponse.json({ message: "Error updating custom field definition", error: error.message }, { status: 500 });
  }
}

/**
 * @openapi
 * /api/settings/custom-field-definitions/{id}:
 *   delete:
 *     summary: Delete a custom field definition by ID
 *     description: Deletes a custom field definition. Requires Admin or CUSTOM_FIELDS_MANAGE permission.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the custom field definition
 *     responses:
 *       200:
 *         description: Custom field definition deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (insufficient permissions)
 *       404:
 *         description: Not found
 *       500:
 *         description: Server error
 */
export async function DELETE(request: NextRequest) {
  const id = extractIdFromUrl(request);
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== 'Admin' && !session.user.modulePermissions?.includes('CUSTOM_FIELDS_MANAGE')) {
    await logAudit('WARN', `Forbidden attempt to delete custom field by ${session.user.name}.`, 'API:CustomFields:Delete', session.user.id);
    return NextResponse.json({ message: "Forbidden: Insufficient permissions" }, { status: 403 });
  }

  if (!id) {
    return NextResponse.json({ message: "Field ID is required" }, { status: 400 });
  }

  try {
    // Check if field exists and get its details
    const existingField = await getPool().query(
      'SELECT * FROM "CustomFieldDefinition" WHERE id = $1',
      [id]
    );

    if (existingField.rows.length === 0) {
      return NextResponse.json({ message: "Custom field definition not found" }, { status: 404 });
    }

    const fieldData = existingField.rows[0];

    // Check if field is being used in any records
    const usageQuery = `
      SELECT COUNT(*) as count 
      FROM "Candidate" 
      WHERE "customAttributes" ? $1
      UNION ALL
      SELECT COUNT(*) as count 
      FROM "Position" 
      WHERE "customAttributes" ? $1
    `;
    
    const usageResult = await getPool().query(usageQuery, [fieldData.field_key]);
    const totalUsage = usageResult.rows.reduce((sum, row) => sum + parseInt(row.count), 0);

    if (totalUsage > 0) {
      return NextResponse.json({ 
        message: `Cannot delete custom field "${fieldData.label}" as it is being used in ${totalUsage} record(s). Please remove the field from all records first.` 
      }, { status: 409 });
    }

    // Delete the field definition
    await getPool().query('DELETE FROM "CustomFieldDefinition" WHERE id = $1', [id]);

    await logAudit('AUDIT', 
      `Custom field "${fieldData.label}" (${fieldData.field_key}) deleted by ${session.user.name}.`, 
      'API:CustomFields:Delete', 
      session.user.id, 
      { fieldId: id, modelName: fieldData.model_name, fieldKey: fieldData.field_key }
    );

    return NextResponse.json({ message: "Custom field definition deleted successfully" }, { status: 200 });
  } catch (error: any) {
    console.error(`Failed to delete custom field definition ${id}:`, error);
    await logAudit('ERROR', 
      `Failed to delete custom field definition (ID: ${id}). Error: ${error.message}`, 
      'API:CustomFields:Delete', 
      session.user.id, 
      { fieldId: id }
    );
    return NextResponse.json({ message: "Error deleting custom field definition", error: error.message }, { status: 500 });
  }
}
