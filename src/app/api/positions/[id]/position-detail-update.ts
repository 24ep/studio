import { NextResponse, type NextRequest } from 'next/server';
import type { QueryResultRow } from 'pg';
import { validateUuid } from '@/lib/security';
import { logAudit } from '@/lib/auditLog';
import { readRequestJsonResult } from '@/lib/request-json';
import type { DbClient } from '@/lib/db';
import { getPositionActor } from './position-detail-auth';
import { connectPositionDb, POSITION_DETAIL_SELECT, shapePositionDetail, type PositionDetailRow } from './position-detail-data';
import { updatePositionSchema, type PositionRouteContext, type UpdatePositionInput } from './position-detail-schema';
import { buildPositionUpdateQuery } from './position-detail-update-query';
import { publishPositionUpdated, syncRecruiterAssignmentAfterPositionUpdate } from './position-detail-update-side-effects';

type RecruiterRow = QueryResultRow & {
  id: string;
  name: string;
  role: string;
};

type ExistingPositionRow = QueryResultRow & {
  id: string;
  title: string;
  customAttributes?: unknown;
  recruiterId?: string | null;
};

type PositionDbError = Error & {
  code?: string;
};

function toPositionDbError(error: unknown): PositionDbError {
  return error instanceof Error ? error as PositionDbError : new Error(String(error)) as PositionDbError;
}

function parsePositionEditPermissions(modulePermissions: unknown, actingUserRole?: string) {
  if (!Array.isArray(modulePermissions)) {
    return {
      ok: false as const,
      response: NextResponse.json({ message: 'Internal server error: invalid permission structure' }, { status: 500 }),
    };
  }

  const isAdmin = actingUserRole === 'Admin';
  return {
    ok: true as const,
    canEdit: isAdmin
      || modulePermissions.includes('POSITIONS_EDIT_BASIC')
      || modulePermissions.includes('POSITIONS_EDIT_DETAILED'),
    canAssignRecruiter: isAdmin || modulePermissions.includes('POSITIONS_RECRUITER_ASSIGN'),
  };
}

async function parseUpdateBody(request: NextRequest) {
  const result = await readRequestJsonResult(request);
  if (!result.ok) {
    return {
      ok: false as const,
      response: NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 }),
      body: null,
    };
  }

  const validationResult = updatePositionSchema.safeParse(result.value);
  if (!validationResult.success) {
    return {
      ok: false as const,
      response: NextResponse.json({ message: 'Invalid input', errors: validationResult.error.flatten().fieldErrors }, { status: 400 }),
      body: result.value,
    };
  }

  return { ok: true as const, data: validationResult.data, body: validationResult.data };
}

async function validateRecruiterIfProvided(client: DbClient, updateData: UpdatePositionInput) {
  if (!updateData.recruiterId) {
    return null;
  }

  const recruiterResult = await client.query<RecruiterRow>('SELECT id, name, role FROM "User" WHERE id = $1::uuid', [updateData.recruiterId]);
  if (recruiterResult.rows.length === 0) {
    return NextResponse.json({ message: 'Recruiter not found' }, { status: 400 });
  }

  const recruiter = recruiterResult.rows[0];
  if (recruiter.role !== 'Recruiter' && recruiter.role !== 'Admin') {
    return NextResponse.json({ message: 'User is not a recruiter' }, { status: 400 });
  }

  return null;
}

async function validateOrganizationUnitIfProvided(client: DbClient, updateData: UpdatePositionInput) {
  if (!updateData.organizationUnitId) return null;
  const result = await client.query<{ id: string; department: string }>(
    `SELECT id, department FROM hr_departments WHERE id = $1::uuid AND unit_type = 'unit' AND is_active = true`,
    [updateData.organizationUnitId],
  );
  if (!result.rows[0]) {
    return NextResponse.json({ message: 'Select an active organization unit.' }, { status: 400 });
  }
  updateData.department = result.rows[0].department;
  return null;
}

export async function handleUpdatePosition(request: NextRequest, { params }: PositionRouteContext) {
  const actor = await getPositionActor();
  if (!actor.actingUserId) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  if (!validateUuid(id)) {
    console.error('[SECURITY] Invalid UUID format in positions PUT request:', id);
    return NextResponse.json({ message: 'Invalid position ID format' }, { status: 400 });
  }

  const parsedBody = await parseUpdateBody(request);
  if (!parsedBody.ok) {
    return parsedBody.response;
  }

  const client = await connectPositionDb();
  if (client instanceof NextResponse) {
    return client;
  }

  try {
    await client.query('BEGIN');

    const existingResult = await client.query<ExistingPositionRow>('SELECT id, title, "customAttributes", "recruiterId" FROM "Position" WHERE id = $1', [id]);
    if (existingResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({ message: 'Position not found' }, { status: 404 });
    }

    const updateData = parsedBody.data;
    const wantsToChangeRecruiter = Object.prototype.hasOwnProperty.call(updateData, 'recruiterId');
    const permissions = parsePositionEditPermissions(actor.modulePermissions, actor.actingUserRole);
    if (!permissions.ok) {
      await client.query('ROLLBACK');
      return permissions.response;
    }

    if (wantsToChangeRecruiter && !permissions.canAssignRecruiter) {
      await client.query('ROLLBACK');
      return NextResponse.json({ message: 'Forbidden: insufficient permissions to assign recruiter' }, { status: 403 });
    }

    const recruiterValidationResponse = await validateRecruiterIfProvided(client, updateData);
    if (recruiterValidationResponse) {
      await client.query('ROLLBACK');
      return recruiterValidationResponse;
    }
    const organizationValidationResponse = await validateOrganizationUnitIfProvided(client, updateData);
    if (organizationValidationResponse) {
      await client.query('ROLLBACK');
      return organizationValidationResponse;
    }

    const updateQuery = buildPositionUpdateQuery(updateData, id);
    if (!updateQuery) {
      await client.query('ROLLBACK');
      return NextResponse.json({ message: 'No fields to update' }, { status: 400 });
    }

    if (!permissions.canEdit) {
      await client.query('ROLLBACK');
      return NextResponse.json({ message: 'Forbidden: insufficient permissions to edit positions' }, { status: 403 });
    }

    const updateResult = await client.query<PositionDetailRow>(updateQuery.query, updateQuery.values);
    if (updateResult.rowCount === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({ message: 'Position not found or update failed' }, { status: 404 });
    }

    await client.query('COMMIT');

    const updatedPosition = updateResult.rows[0];
    const enrichedResult = await client.query<PositionDetailRow>(POSITION_DETAIL_SELECT, [id]);
    const enrichedPosition = enrichedResult.rows[0];
    const positionWithCustomAttrs = shapePositionDetail(enrichedPosition);
    const recruiterSync = await syncRecruiterAssignmentAfterPositionUpdate(
      id,
      enrichedPosition,
      updateData,
      existingResult.rows[0].recruiterId,
      actor.actingUserId,
      actor.actingUserName
    );

    await logAudit('AUDIT', `Position '${updatedPosition.title}' updated by ${actor.actingUserName}.`, 'API:Positions:Update', actor.actingUserId, { positionId: id });
    publishPositionUpdated(positionWithCustomAttrs, actor.actingUserId);

    return NextResponse.json({
      message: 'Position updated successfully',
      position: positionWithCustomAttrs,
      recruiterSync,
    });
  } catch (error: unknown) {
    const dbError = toPositionDbError(error);
    try {
      await client.query('ROLLBACK');
    } catch (rollbackError) {
      console.error('[Positions API] Error during rollback:', rollbackError);
    }

    if (dbError.code === '23503') {
      await logAudit('ERROR', `Failed to update position - recruiter not found. Error: ${dbError.message}`, 'API:Positions:Update', actor.actingUserId, { positionId: id, input: parsedBody.body });
      return NextResponse.json({ message: 'Recruiter not found in database', error: dbError.message }, { status: 400 });
    }

    await logAudit('ERROR', `Failed to update position. Error: ${dbError.message}`, 'API:Positions:Update', actor.actingUserId, { positionId: id, input: parsedBody.body });
    return NextResponse.json({ message: 'Error updating position', error: dbError.message }, { status: 500 });
  } finally {
    client.release();
  }
}
