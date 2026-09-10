import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { getPool } from '@/lib/db';
import { handleCors } from '@/lib/cors';
import { dispatchWebhooks } from '@/lib/webhookDispatcher';
import { getDefaultMatchCriteria } from '@/lib/systemSettings';
import { broadcastPositionCreated } from '@/lib/simple-broadcaster';
import { logAudit } from '@/lib/auditLog';
import { sanitizeHtml, sanitizeRichHtml } from '@/lib/security';
import { readRequestJsonResult } from '@/lib/request-json';
import type { Session } from 'next-auth';
import type { QueryResultRow } from 'pg';

const createPositionSchema = z.object({
  title: z.string().min(1, { message: 'Title is required' }),
  department: z.string().min(1, { message: 'Department is required' }),
  divisionId: z.string().uuid({ message: 'Division is required' }),
  departmentId: z.string().uuid({ message: 'Department is required' }),
  sectionId: z.string().uuid({ message: 'Section is required' }),
  unitId: z.string().uuid({ message: 'Unit is required' }),
  description: z.string().optional().nullable(),
  matchCriteria: z.string().optional().nullable(),
  isOpen: z.boolean({ required_error: 'isOpen status is required' }),
  positionLevel: z.string().optional().nullable(),
  reportsTo: z.string().optional().nullable(),
  costCenter: z.string().optional().nullable(),
  budget: z.string().optional().nullable(),
  employmentType: z.string().optional().nullable(),
  jobFamily: z.string().optional().nullable(),
  gradeId: z.string().uuid().optional().nullable(),
  recruiterId: z.string().uuid().optional().nullable(),
  onboardingClientId: z.string().uuid().optional().nullable(),
  onboardingAssetTypes: z.array(z.string()).default([]),
  custom_attributes: z.record(z.unknown()).optional().nullable(),
});

type CreatedPositionRow = QueryResultRow & {
  id: string;
  title: string;
  department: string;
  positionLevel?: string | null;
  customAttributes?: unknown;
};

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export async function handleCreatePosition(
  request: NextRequest,
  session: Session,
  actingUserId: string | null,
  actingUserName: string
) {
  const defaultMatchCriteria = await getDefaultMatchCriteria();
  const parsedBody = await parseCreatePositionBody(request);
  if (parsedBody instanceof NextResponse) {
    return parsedBody;
  }

  const validationResult = createPositionSchema.safeParse(parsedBody);
  if (!validationResult.success) {
    return NextResponse.json(
      { message: 'Invalid input', errors: validationResult.error.flatten().fieldErrors },
      { status: 400, headers: handleCors(request) }
    );
  }

  const validatedData = validationResult.data;

  try {
    await assertValidOrganizationPath(validatedData);
    const newPosition = await insertPosition(validatedData, defaultMatchCriteria);

    await logAudit(
      'AUDIT',
      `Position '${newPosition.title}' (ID: ${newPosition.id}) created by ${actingUserName}.`,
      'API:Positions:Create',
      actingUserId,
      {
        targetPositionId: newPosition.id,
        title: newPosition.title,
        department: newPosition.department,
        positionLevel: newPosition.positionLevel,
      }
    );

    try {
      await dispatchWebhooks.positionCreated(newPosition);
    } catch {
      // Webhook failures should not fail position creation.
    }

    broadcastPositionCreated(newPosition, actingUserId || undefined);

    return NextResponse.json(newPosition, { status: 201, headers: handleCors(request) });
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    await logAudit(
      'ERROR',
      `Failed to create position '${validatedData.title}' by ${actingUserName}. Error: ${errorMessage}`,
      'API:Positions:Create',
      actingUserId,
      { title: validatedData.title }
    );
    const organizationValidationError = errorMessage.startsWith('Invalid or inactive organization path');
    return NextResponse.json(
      { message: organizationValidationError ? errorMessage : 'Error creating position', error: errorMessage },
      { status: organizationValidationError ? 400 : 500, headers: handleCors(request) }
    );
  }
}

async function parseCreatePositionBody(request: NextRequest): Promise<unknown | NextResponse> {
  const result = await readRequestJsonResult(request);
  if (!result.ok) {
    return NextResponse.json(
      { message: 'Error parsing request body', error: getErrorMessage(result.error) },
      { status: 400, headers: handleCors(request) }
    );
  }

  return result.value;
}

async function insertPosition(validatedData: z.infer<typeof createPositionSchema>, defaultMatchCriteria: string | null) {
  const newPositionId = uuidv4();
  const insertQuery = `
    INSERT INTO "Position" (id, title, department, description, "matchCriteria", "isOpen", "positionLevel", "gradeId", "recruiterId", "organization_unit_id", "customAttributes", "createdAt", "updatedAt")
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::uuid, $11, NOW(), NOW())
    RETURNING *;
  `;
  const values = [
    newPositionId,
    sanitizeHtml(validatedData.title || ''),
    validatedData.department,
    validatedData.description ? sanitizeRichHtml(validatedData.description) : null,
    validatedData.matchCriteria && validatedData.matchCriteria.trim() !== ''
      ? sanitizeRichHtml(validatedData.matchCriteria)
      : defaultMatchCriteria,
    validatedData.isOpen,
    validatedData.positionLevel || null,
    validatedData.gradeId || null,
    validatedData.recruiterId || null,
    validatedData.unitId,
    {
      ...(validatedData.custom_attributes || {}),
      onboardingClientId: validatedData.onboardingClientId || null,
      onboardingAssetTypes: validatedData.onboardingAssetTypes,
      reportsTo: validatedData.reportsTo || null,
      costCenter: validatedData.costCenter || null,
      budget: validatedData.budget || null,
      employmentType: validatedData.employmentType || null,
      jobFamily: validatedData.jobFamily || null,
    },
  ];
  const result = await getPool().query<CreatedPositionRow>(insertQuery, values);

  return {
    ...result.rows[0],
    custom_attributes: result.rows[0].customAttributes || {},
  };
}

async function assertValidOrganizationPath(data: z.infer<typeof createPositionSchema>) {
  const result = await getPool().query<{ valid: boolean }>(`
    SELECT EXISTS (
      SELECT 1
      FROM hr_departments division
      INNER JOIN hr_departments department ON department.parent_id = division.id
      INNER JOIN hr_departments section ON section.parent_id = department.id
      INNER JOIN hr_departments unit ON unit.parent_id = section.id
      WHERE division.id = $1::uuid AND division.unit_type = 'division' AND division.is_active = true
        AND department.id = $2::uuid AND department.unit_type = 'department' AND department.is_active = true
        AND section.id = $3::uuid AND section.unit_type = 'section' AND section.is_active = true
        AND unit.id = $4::uuid AND unit.unit_type = 'unit' AND unit.is_active = true
        AND department.name = $5
    ) AS valid
  `, [data.divisionId, data.departmentId, data.sectionId, data.unitId, data.department]);
  if (!result.rows[0]?.valid) {
    throw new Error('Invalid or inactive organization path. Select the organization units again.');
  }
}
