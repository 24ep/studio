import { NextResponse, type NextRequest } from 'next/server';
import { logAudit } from '@/lib/auditLog';
import { readRequestJsonResult } from '@/lib/request-json';
import { requireCustomFieldEditSession, requireCustomFieldSession } from './custom-field-definition-auth';
import {
  createCustomFieldDefinition,
  customFieldDefinitionIdExists,
  customFieldExists,
  fetchCustomFieldDefinitions,
  updateCustomFieldDefinition,
} from './custom-field-definition-data';
import { createCustomFieldSchema, updateCustomFieldSchema, type CustomFieldModelName } from './custom-field-definition-schema';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

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

export async function GET(request: NextRequest) {
  const sessionResult = await requireCustomFieldSession();
  if (!sessionResult.ok) {
    return sessionResult.response;
  }

  const modelName = new URL(request.url).searchParams.get('model') as CustomFieldModelName | null;

  try {
    const fields = await fetchCustomFieldDefinitions(modelName);
    return NextResponse.json(fields, { status: 200 });
  } catch (error) {
    const message = getErrorMessage(error);
    console.error('Failed to fetch custom field definitions:', error);
    await logAudit('ERROR', `Failed to fetch custom field definitions. Error: ${message}`, 'API:CustomFields:GetAll', sessionResult.session.user.id);
    return NextResponse.json({ message: 'Error fetching custom field definitions', error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const sessionResult = await requireCustomFieldEditSession('Create');
  if (!sessionResult.ok) {
    return sessionResult.response;
  }

  const parsedJson = await parseRequestJson(request);
  if (!parsedJson.ok) {
    return parsedJson.response;
  }

  const validationResult = createCustomFieldSchema.safeParse(parsedJson.body);
  if (!validationResult.success) {
    return NextResponse.json({ message: 'Invalid input', errors: validationResult.error.flatten().fieldErrors }, { status: 400 });
  }

  const input = validationResult.data;

  try {
    if (await customFieldExists(input.model_name, input.field_code)) {
      return NextResponse.json({
        message: `A custom field with code "${input.field_code}" already exists for ${input.model_name}`,
      }, { status: 409 });
    }

    const newField = await createCustomFieldDefinition(input);

    await logAudit(
      'AUDIT',
      `Custom field "${input.label}" (${input.field_code}) created for ${input.model_name} by ${sessionResult.session.user.name}.`,
      'API:CustomFields:Create',
      sessionResult.session.user.id,
      { fieldId: newField.id, modelName: input.model_name, fieldCode: input.field_code, fieldType: input.field_type }
    );

    return NextResponse.json(newField.mapped, { status: 201 });
  } catch (error) {
    const message = getErrorMessage(error);
    console.error('Failed to create custom field definition:', error);
    await logAudit('ERROR', `Failed to create custom field definition. Error: ${message}`, 'API:CustomFields:Create', sessionResult.session.user.id, {
      input: parsedJson.body,
    });
    return NextResponse.json({ message: 'Error creating custom field definition', error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const sessionResult = await requireCustomFieldEditSession('Update');
  if (!sessionResult.ok) {
    return sessionResult.response;
  }

  const fieldId = new URL(request.url).searchParams.get('id');
  if (!fieldId) {
    return NextResponse.json({ message: 'Field ID is required' }, { status: 400 });
  }

  const parsedJson = await parseRequestJson(request);
  if (!parsedJson.ok) {
    return parsedJson.response;
  }

  const validationResult = updateCustomFieldSchema.safeParse(parsedJson.body);
  if (!validationResult.success) {
    return NextResponse.json({ message: 'Invalid input', errors: validationResult.error.flatten().fieldErrors }, { status: 400 });
  }

  try {
    if (!(await customFieldDefinitionIdExists(fieldId))) {
      return NextResponse.json({ message: 'Custom field not found' }, { status: 404 });
    }

    const updatedField = await updateCustomFieldDefinition(fieldId, validationResult.data);
    if (!updatedField) {
      return NextResponse.json({ message: 'No fields to update' }, { status: 400 });
    }

    await logAudit(
      'AUDIT',
      `Custom field "${updatedField.raw.label}" (${updatedField.raw.field_code}) updated by ${sessionResult.session.user.name}.`,
      'API:CustomFields:Update',
      sessionResult.session.user.id,
      { fieldId, fieldCode: updatedField.raw.field_code, fieldType: updatedField.raw.field_type }
    );

    return NextResponse.json(updatedField.mapped, { status: 200 });
  } catch (error) {
    const message = getErrorMessage(error);
    console.error('Failed to update custom field definition:', error);
    await logAudit('ERROR', `Failed to update custom field definition. Error: ${message}`, 'API:CustomFields:Update', sessionResult.session.user.id);
    return NextResponse.json({ message: 'Error updating custom field definition', error: message }, { status: 500 });
  }
}
