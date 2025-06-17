// src/app/api/settings/custom-field-definitions/[id]/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import pool from '../../../../../lib/db';
import { z } from 'zod';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import type { CustomFieldDefinition, CustomFieldType } from '@/lib/types';
import { CUSTOM_FIELD_TYPES } from '@/lib/types';
import { logAudit } from '@/lib/auditLog';

const customFieldOptionSchema = z.object({
  value: z.string().min(1),
  label: z.string().min(1),
});

const updateCustomFieldDefinitionSchema = z.object({
  // model_name and field_key are generally not updatable to avoid complex data migrations
  label: z.string().min(1, "Label is required").optional(),
  field_type: z.enum(CUSTOM_FIELD_TYPES as [CustomFieldType, ...CustomFieldType[]]).optional(),
  options: z.array(customFieldOptionSchema).optional().nullable(),
  is_required: z.boolean().optional(),
  sort_order: z.number().int().optional(),
});

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'Admin' && !session?.user?.modulePermissions?.includes('CUSTOM_FIELDS_MANAGE')) {
     await logAudit('WARN', `Forbidden attempt to update custom field definition (ID: ${params.id}) by user ${session?.user?.email || 'Unknown'}.`, 'API:CustomFields:Update', session?.user?.id, { targetFieldId: params.id });
    return NextResponse.json({ message: "Forbidden: Insufficient permissions" }, { status: 403 });
  }

  let body;
  try {
    body = await request.json();
  } catch (error) {
    return NextResponse.json({ message: "Error parsing request body", error: (error as Error).message }, { status: 400 });
  }

  const validationResult = updateCustomFieldDefinitionSchema.safeParse(body);
  if (!validationResult.success) {
    return NextResponse.json(
      { message: "Invalid input", errors: validationResult.error.flatten().fieldErrors },
      { status: 400 }
    );
  }
  
  const updates = validationResult.data;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const existingFieldResult = await client.query('SELECT * FROM "CustomFieldDefinition" WHERE id = $1 FOR UPDATE', [params.id]);
    if (existingFieldResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({ message: "Custom field definition not found" }, { status: 404 });
    }
    const existingField: CustomFieldDefinition = existingFieldResult.rows[0];

    // Validation for options based on field_type
    const finalFieldType = updates.field_type || existingField.field_type;
    const finalOptions = updates.options === undefined ? existingField.options : updates.options;

    if (['select_single', 'select_multiple'].includes(finalFieldType) && (!finalOptions || finalOptions.length === 0)) {
      await client.query('ROLLBACK');
      return NextResponse.json({ message: "Options are required for select field types." }, { status: 400 });
    }
    if (!['select_single', 'select_multiple'].includes(finalFieldType) && finalOptions && finalOptions.length > 0) {
       await client.query('ROLLBACK');
      return NextResponse.json({ message: "Options should only be provided for select field types. Clear options or change field type." }, { status: 400 });
    }

    const updateFields: string[] = [];
    const updateValues: any[] = [];
    let paramIndex = 1;

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        if (key === 'options') {
          updateFields.push(`${key} = $${paramIndex++}`);
          updateValues.push(value ? JSON.stringify(value) : null);
        } else {
          updateFields.push(`${key} = $${paramIndex++}`);
          updateValues.push(value);
        }
      }
    });

    if (updateFields.length === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json(existingField, { status: 200 }); // No actual changes
    }

    updateFields.push(`"updatedAt" = NOW()`);
    updateValues.push(params.id);

    const updateQuery = `UPDATE "CustomFieldDefinition" SET ${updateFields.join(', ')} WHERE id = $${paramIndex} RETURNING *;`;
    const result = await client.query(updateQuery, updateValues);
    const updatedField = result.rows[0];

    await client.query('COMMIT');
    await logAudit('AUDIT', `Custom field definition '${updatedField.label}' (ID: ${updatedField.id}) for model '${updatedField.model_name}' updated by ${session.user.name}.`, 'API:CustomFields:Update', session.user.id, { targetFieldId: updatedField.id, changes: Object.keys(updates) });
    return NextResponse.json(updatedField, { status: 200 });

  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error(`Failed to update custom field definition ${params.id}:`, error);
    await logAudit('ERROR', `Failed to update custom field definition (ID: ${params.id}) by ${session.user.name}. Error: ${error.message}`, 'API:CustomFields:Update', session.user.id, { targetFieldId: params.id });
    return NextResponse.json({ message: "Error updating custom field definition", error: error.message }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'Admin' && !session?.user?.modulePermissions?.includes('CUSTOM_FIELDS_MANAGE')) {
    await logAudit('WARN', `Forbidden attempt to delete custom field definition (ID: ${params.id}) by user ${session?.user?.email || 'Unknown'}.`, 'API:CustomFields:Delete', session?.user?.id, { targetFieldId: params.id });
    return NextResponse.json({ message: "Forbidden: Insufficient permissions" }, { status: 403 });
  }

  try {
    // Note: Deleting a definition does not automatically clean up data from JSONB columns in Candidate/Position tables.
    // This might be desired to avoid data loss, or a cleanup mechanism could be added if strict data removal is needed.
    const deleteResult = await pool.query('DELETE FROM "CustomFieldDefinition" WHERE id = $1 RETURNING label, field_key, model_name', [params.id]);
    
    if (deleteResult.rowCount === 0) {
      return NextResponse.json({ message: "Custom field definition not found" }, { status: 404 });
    }
    const deletedField = deleteResult.rows[0];
    await logAudit('AUDIT', `Custom field definition '${deletedField.label}' (Key: ${deletedField.field_key}) for model '${deletedField.model_name}' deleted by ${session.user.name}.`, 'API:CustomFields:Delete', session.user.id, { deletedFieldId: params.id, deletedFieldLabel: deletedField.label });
    return NextResponse.json({ message: "Custom field definition deleted successfully" }, { status: 200 });

  } catch (error: any) {
    console.error(`Failed to delete custom field definition ${params.id}:`, error);
    // Check for foreign key constraints if definitions were linked elsewhere, though not in current schema.
    // if (error.code === '23503') { /* foreign_key_violation */ }
    await logAudit('ERROR', `Failed to delete custom field definition (ID: ${params.id}) by ${session.user.name}. Error: ${error.message}`, 'API:CustomFields:Delete', session.user.id, { targetFieldId: params.id });
    return NextResponse.json({ message: "Error deleting custom field definition", error: error.message }, { status: 500 });
  }
}
