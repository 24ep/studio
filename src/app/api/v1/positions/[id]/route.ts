export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest } from 'next/server';
import { getPool } from '@/lib/db';
import { handleCors } from '@/lib/cors';
import { readRequestJsonResult } from '@/lib/request-json';
import {
  SimpleErrorHandler,
  createUnauthorizedError,
  createForbiddenError,
  createValidationError,
  createNotFoundError,
  createInternalServerError
} from '@/lib/errors';
import { logAudit } from '@/lib/auditLog';
import {
  POSITION_DETAIL_QUERY,
  buildPositionUpdateQuery,
  formatZodFieldErrors,
  getActingUserName,
  hasPositionDeletePermission,
  hasPositionUpdatePermission,
  serializePositionRow,
  serializeUpdatedPositionRow,
  toAuditPayload,
  updatePositionSchema,
  verifyBearerApiUser,
} from './route-utils';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await verifyBearerApiUser(req);
  if (!user) {
    return SimpleErrorHandler.handleApiError(req, createUnauthorizedError('Authentication required'));
  }

  const { id } = await params;
  const client = await getPool().connect();
  try {
    const result = await client.query(POSITION_DETAIL_QUERY, [id]);
    if (result.rows.length === 0) {
      return SimpleErrorHandler.handleApiError(req, createNotFoundError('Position not found'));
    }

    return SimpleErrorHandler.createSuccessResponse(req, serializePositionRow(result.rows[0]), 200);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return SimpleErrorHandler.handleApiError(req, createInternalServerError(`Error fetching position: ${errorMessage}`));
  } finally {
    client.release();
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await verifyBearerApiUser(req);
  if (!user || !hasPositionUpdatePermission(user)) {
    return SimpleErrorHandler.handleApiError(req, createForbiddenError('Insufficient permissions to update positions'));
  }

  const { id } = await params;
  const bodyResult = await readRequestJsonResult(req);
  if (!bodyResult.ok) {
    return SimpleErrorHandler.handleApiError(req, createValidationError('Invalid JSON body'));
  }
  const body = bodyResult.value;
  const validationResult = updatePositionSchema.safeParse(body);
  if (!validationResult.success) {
    return SimpleErrorHandler.handleApiError(req, createValidationError(`Invalid input - ${formatZodFieldErrors(validationResult.error)}`));
  }

  const updateData = validationResult.data;
  const updateQuery = buildPositionUpdateQuery(updateData, id);
  if (!updateQuery) {
    return SimpleErrorHandler.handleApiError(req, createValidationError('No fields to update'));
  }

  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const positionExistsQuery = 'SELECT id FROM "Position" WHERE id = $1';
    const existingResult = await client.query(positionExistsQuery, [id]);
    if (existingResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return SimpleErrorHandler.handleApiError(req, createNotFoundError('Position not found'));
    }

    const updateResult = await client.query(updateQuery.text, updateQuery.values);
    await client.query('COMMIT');
    const updatedPosition = updateResult.rows[0];
    const actingUserName = getActingUserName(user);
    await logAudit('AUDIT', `Position '${updatedPosition.title}' updated by ${actingUserName}.`, 'API:V1:Positions:Update', user.id, { positionId: id, updatedFields: updateData });
    return SimpleErrorHandler.createSuccessResponse(req, {
      message: 'Position updated successfully',
      position: serializeUpdatedPositionRow(updatedPosition),
    }, 200);
  } catch (error) {
    await client.query('ROLLBACK');
    const errorMessage = error instanceof Error ? error.message : String(error);
    const actingUserName = getActingUserName(user);
    await logAudit('ERROR', `Failed to update position (ID: ${id}) by ${actingUserName}. Error: ${errorMessage}`, 'API:V1:Positions:Update', user.id, { positionId: id, error: errorMessage, ...toAuditPayload(body) });
    return SimpleErrorHandler.handleApiError(req, createInternalServerError(`Error updating position: ${errorMessage}`));
  } finally {
    client.release();
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await verifyBearerApiUser(req);
  if (!user || !hasPositionDeletePermission(user)) {
    return SimpleErrorHandler.handleApiError(req, createForbiddenError('Insufficient permissions to delete positions'));
  }

  const { id } = await params;
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const currentPosition = await client.query('SELECT * FROM "Position" WHERE id = $1', [id]);
    if (currentPosition.rows.length === 0) {
      await client.query('ROLLBACK');
      return SimpleErrorHandler.handleApiError(req, createNotFoundError('Position not found'));
    }
    await client.query('DELETE FROM "Position" WHERE id = $1', [id]);
    await client.query('COMMIT');
    const actingUserName = getActingUserName(user);
    await logAudit('AUDIT', `Position '${currentPosition.rows[0].title}' deleted by ${actingUserName}.`, 'API:V1:Positions:Delete', user.id, { positionId: id });
    return SimpleErrorHandler.createSuccessResponse(req, { message: 'Position deleted successfully' }, 200);
  } catch (error) {
    await client.query('ROLLBACK');
    const errorMessage = error instanceof Error ? error.message : String(error);
    const actingUserName = getActingUserName(user);
    await logAudit('ERROR', `Failed to delete position (ID: ${id}) by ${actingUserName}. Error: ${errorMessage}`, 'API:V1:Positions:Delete', user.id, { positionId: id, error: errorMessage });
    return SimpleErrorHandler.handleApiError(req, createInternalServerError(`Error deleting position: ${errorMessage}`));
  } finally {
    client.release();
  }
}

export async function OPTIONS(request: NextRequest) {
  const headers = handleCors(request);
  return new Response(null, { status: 200, headers });
} 
