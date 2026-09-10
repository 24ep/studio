import { NextResponse, type NextRequest } from 'next/server';
import { logAudit } from '@/lib/auditLog';
import { validateUuid } from '@/lib/security';
import { readRequestJsonResult } from '@/lib/request-json';
import { requireCustomFieldEditSession, requireCustomFieldSession } from '../custom-field-definition-auth';
import {
  deleteCustomFieldDefinition,
  fetchCustomFieldDefinitionById,
  getCustomFieldUsageCount,
  updateCustomFieldDefinitionById,
} from '../custom-field-definition-data';
import { updateCustomFieldByIdSchema } from '../custom-field-definition-schema';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type RouteContext = { params: Promise<{ id: string }> };

async function getValidFieldId(context: RouteContext) {
  const { id } = await context.params;
  if (!validateUuid(id)) {
    console.error('[SECURITY] Invalid UUID format in custom-field-definitions request:', id);
    return {
      ok: false as const,
      response: NextResponse.json({ message: 'Invalid custom field definition ID format' }, { status: 400 }),
    };
  }

  return { ok: true as const, id };
}

async function parseRequestJson(request: NextRequest) {
  const result = await readRequestJsonResult(request);
  if (!result.ok) {
    const message = result.error instanceof Error ? result.error.message : 'Unknown error';
    return {
      ok: false as const,
      response: NextResponse.json({ message: 'Error parsing request body', error: message }, { status: 400 }),
    };
  }

  return { ok: true as const, body: result.value };
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Unknown error';
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const idResult = await getValidFieldId(context);
  if (!idResult.ok) {
    return idResult.response;
  }

  const sessionResult = await requireCustomFieldSession();
  if (!sessionResult.ok) {
    return sessionResult.response;
  }

  try {
    const field = await fetchCustomFieldDefinitionById(idResult.id);
    if (!field) {
      return NextResponse.json({ message: 'Custom field definition not found' }, { status: 404 });
    }

    return NextResponse.json(field.mapped, { status: 200 });
  } catch (error) {
    const message = getErrorMessage(error);
    console.error(`Failed to fetch custom field definition ${idResult.id}:`, error);
    await logAudit('ERROR', `Failed to fetch custom field definition (ID: ${idResult.id}). Error: ${message}`, 'API:CustomFields:GetById', sessionResult.session.user.id);
    return NextResponse.json({ message: 'Error fetching custom field definition', error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const idResult = await getValidFieldId(context);
  if (!idResult.ok) {
    return idResult.response;
  }

  const sessionResult = await requireCustomFieldEditSession('Update');
  if (!sessionResult.ok) {
    return sessionResult.response;
  }

  const parsedJson = await parseRequestJson(request);
  if (!parsedJson.ok) {
    return parsedJson.response;
  }

  const validationResult = updateCustomFieldByIdSchema.safeParse(parsedJson.body);
  if (!validationResult.success) {
    return NextResponse.json({ message: 'Invalid input', errors: validationResult.error.flatten().fieldErrors }, { status: 400 });
  }

  try {
    const existingField = await fetchCustomFieldDefinitionById(idResult.id);
    if (!existingField) {
      return NextResponse.json({ message: 'Custom field definition not found' }, { status: 404 });
    }

    const updatedField = await updateCustomFieldDefinitionById(idResult.id, validationResult.data);
    if (!updatedField) {
      return NextResponse.json({ message: 'No fields to update' }, { status: 400 });
    }

    await logAudit(
      'AUDIT',
      `Custom field "${updatedField.raw.label}" (${updatedField.raw.field_key}) updated by ${sessionResult.session.user.name}.`,
      'API:CustomFields:Update',
      sessionResult.session.user.id,
      { fieldId: idResult.id, changes: Object.keys(validationResult.data) }
    );

    return NextResponse.json(updatedField.mapped, { status: 200 });
  } catch (error) {
    const message = getErrorMessage(error);
    console.error(`Failed to update custom field definition ${idResult.id}:`, error);
    await logAudit('ERROR', `Failed to update custom field definition (ID: ${idResult.id}). Error: ${message}`, 'API:CustomFields:Update', sessionResult.session.user.id, {
      fieldId: idResult.id,
      input: parsedJson.body,
    });
    return NextResponse.json({ message: 'Error updating custom field definition', error: message }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const idResult = await getValidFieldId(context);
  if (!idResult.ok) {
    return idResult.response;
  }

  const sessionResult = await requireCustomFieldEditSession('Delete');
  if (!sessionResult.ok) {
    return sessionResult.response;
  }

  try {
    const field = await fetchCustomFieldDefinitionById(idResult.id);
    if (!field) {
      return NextResponse.json({ message: 'Custom field definition not found' }, { status: 404 });
    }

    const totalUsage = await getCustomFieldUsageCount(field.raw.field_code);
    if (totalUsage > 0) {
      return NextResponse.json({
        message: `Cannot delete custom field "${field.raw.label}" as it is being used in ${totalUsage} record(s). Please remove the field from all records first.`,
      }, { status: 409 });
    }

    await deleteCustomFieldDefinition(idResult.id);

    await logAudit(
      'AUDIT',
      `Custom field "${field.raw.label}" (${field.raw.field_code}) deleted by ${sessionResult.session.user.name}.`,
      'API:CustomFields:Delete',
      sessionResult.session.user.id,
      { fieldId: idResult.id, modelName: field.raw.model_name, fieldCode: field.raw.field_code }
    );

    return NextResponse.json({ message: 'Custom field definition deleted successfully' }, { status: 200 });
  } catch (error) {
    const message = getErrorMessage(error);
    console.error(`Failed to delete custom field definition ${idResult.id}:`, error);
    await logAudit('ERROR', `Failed to delete custom field definition (ID: ${idResult.id}). Error: ${message}`, 'API:CustomFields:Delete', sessionResult.session.user.id, {
      fieldId: idResult.id,
    });
    return NextResponse.json({ message: 'Error deleting custom field definition', error: message }, { status: 500 });
  }
}
