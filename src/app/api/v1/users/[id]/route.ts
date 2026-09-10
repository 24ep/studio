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
  createConflictError,
  createInternalServerError
} from '@/lib/errors';
import { logAudit } from '@/lib/auditLog';
import {
  buildUserUpdateQuery,
  formatZodFieldErrors,
  getActingUserName,
  hasUserDeletePermission,
  hasUserEditPermission,
  hasUserViewPermission,
  toAuditPayload,
  updateUserSchema,
  verifyBearerApiUser,
} from './route-utils';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await verifyBearerApiUser(req);
  
  if (!user) {
    return SimpleErrorHandler.handleApiError(req, createUnauthorizedError('Authentication required'));
  }

  if (!hasUserViewPermission(user)) {
    return SimpleErrorHandler.handleApiError(req, createForbiddenError('Insufficient permissions to view users'));
  }

  const { id } = await params;
  const client = await getPool().connect();
  
  try {
    const query = 'SELECT id, name, email, role, "createdAt", "updatedAt" FROM "User" WHERE id = $1';
    const result = await client.query(query, [id]);
    
    if (result.rows.length === 0) {
      return SimpleErrorHandler.handleApiError(req, createNotFoundError('User not found'));
    }

    const userData = result.rows[0];
    return SimpleErrorHandler.createSuccessResponse(req, {
      ...userData,
    }, 200);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return SimpleErrorHandler.handleApiError(req, createInternalServerError(`Error fetching user: ${errorMessage}`));
  } finally {
    client.release();
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await verifyBearerApiUser(req);
  
  if (!user) {
    return SimpleErrorHandler.handleApiError(req, createUnauthorizedError('Authentication required'));
  }

  if (!hasUserEditPermission(user)) {
    return SimpleErrorHandler.handleApiError(req, createForbiddenError('Insufficient permissions to update users'));
  }

  const { id } = await params;
  const bodyResult = await readRequestJsonResult(req);
  if (!bodyResult.ok) {
    return SimpleErrorHandler.handleApiError(req, createValidationError('Invalid JSON body'));
  }

  const body = bodyResult.value;
  const validationResult = updateUserSchema.safeParse(body);
  if (!validationResult.success) {
    return SimpleErrorHandler.handleApiError(req, createValidationError(`Invalid input - ${formatZodFieldErrors(validationResult.error)}`));
  }

  const validatedData = validationResult.data;
  const email = validatedData.email;
  const updateQuery = buildUserUpdateQuery(validatedData, id);
  if (!updateQuery) {
    return SimpleErrorHandler.handleApiError(req, createValidationError('No fields to update'));
  }

  const client = await getPool().connect();
  try {
    await client.query('BEGIN');

    const existingResult = await client.query('SELECT * FROM "User" WHERE id = $1', [id]);
    if (existingResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return SimpleErrorHandler.handleApiError(req, createNotFoundError('User not found'));
    }

    if (email && email !== existingResult.rows[0].email) {
      const emailCheckResult = await client.query('SELECT id FROM "User" WHERE email = $1 AND id != $2', [email, id]);
      if (emailCheckResult.rows.length > 0) {
        await client.query('ROLLBACK');
        return SimpleErrorHandler.handleApiError(req, createConflictError('Email is already taken by another user'));
      }
    }

    const updateResult = await client.query(updateQuery.text, updateQuery.values);
    await client.query('COMMIT');

    const updatedUser = updateResult.rows[0];
    const actingUserName = getActingUserName(user);
    await logAudit('AUDIT', `User '${updatedUser.name}' updated by ${actingUserName}.`, 'API:V1:Users:Update', user.id, { userId: id, updatedFields: validatedData });
    return SimpleErrorHandler.createSuccessResponse(req, {
      message: 'User updated successfully',
      user: {
        ...updatedUser,
      }
    }, 200);

  } catch (error) {
    await client.query('ROLLBACK');
    const errorMessage = error instanceof Error ? error.message : String(error);
    const actingUserName = getActingUserName(user);
    await logAudit('ERROR', `Failed to update user (ID: ${id}) by ${actingUserName}. Error: ${errorMessage}`, 'API:V1:Users:Update', user.id, { userId: id, error: errorMessage, ...toAuditPayload(body) });
    return SimpleErrorHandler.handleApiError(req, createInternalServerError(`Error updating user: ${errorMessage}`));
  } finally {
    client.release();
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await verifyBearerApiUser(req);
  
  if (!user) {
    return SimpleErrorHandler.handleApiError(req, createUnauthorizedError('Authentication required'));
  }

  if (!hasUserDeletePermission(user)) {
    return SimpleErrorHandler.handleApiError(req, createForbiddenError('Insufficient permissions to delete users'));
  }

  const { id } = await params;
  const client = await getPool().connect();
  
  try {
    await client.query('BEGIN');

    const existingResult = await client.query('SELECT * FROM "User" WHERE id = $1', [id]);
    if (existingResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return SimpleErrorHandler.handleApiError(req, createNotFoundError('User not found'));
    }

    const applicantsResult = await client.query('SELECT COUNT(*) FROM "Applicant" WHERE "recruiterId" = $1', [id]);
    const applicantCount = parseInt(applicantsResult.rows[0].count, 10);
    
    if (applicantCount > 0) {
      await client.query('ROLLBACK');
      return SimpleErrorHandler.handleApiError(req, createValidationError(`Cannot delete user with assigned applicants. Found ${applicantCount} applicants assigned to this user.`));
    }

    await client.query('DELETE FROM "User" WHERE id = $1', [id]);
    await client.query('COMMIT');
    const actingUserName = getActingUserName(user);
    await logAudit('AUDIT', `User (ID: ${id}) deleted by ${actingUserName}.`, 'API:V1:Users:Delete', user.id, { userId: id });
    return SimpleErrorHandler.createSuccessResponse(req, { message: 'User deleted successfully' }, 200);

  } catch (error) {
    await client.query('ROLLBACK');
    const errorMessage = error instanceof Error ? error.message : String(error);
    const actingUserName = getActingUserName(user);
    await logAudit('ERROR', `Failed to delete user (ID: ${id}) by ${actingUserName}. Error: ${errorMessage}`, 'API:V1:Users:Delete', user.id, { userId: id, error: errorMessage });
    return SimpleErrorHandler.handleApiError(req, createInternalServerError(`Error deleting user: ${errorMessage}`));
  } finally {
    client.release();
  }
}

export async function OPTIONS(request: NextRequest) {
  const headers = handleCors(request);
  return new Response(null, { status: 200, headers });
} 
