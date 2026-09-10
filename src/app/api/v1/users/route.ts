import { NextRequest } from 'next/server';
import { getPool } from '@/lib/db';
import { handleCors } from '@/lib/cors';
import { isJsonObject } from '@/lib/json-types';
import { readRequestJsonResult } from '@/lib/request-json';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
import { SimpleErrorHandler,
  createValidationError,
  createConflictError,
  createInternalServerError
} from '@/lib/errors';;
import { logAudit } from '@/lib/auditLog';
import {
  authorizeV1UsersRequest,
  buildV1UsersListQueries,
  createUserSchema,
  createV1UserId,
  formatCreateUserValidationError,
  getV1ActingUserName,
  parseV1UsersListParams,
  type V1UserRow,
} from './v1-users-route-helpers';

export async function GET(req: NextRequest) {
  const access = await authorizeV1UsersRequest(
    req,
    'USERS_VIEW',
    'Insufficient permissions to view users',
  );
  if (!access.ok) {
    return access.response;
  }

  const listParams = parseV1UsersListParams(req);
  const { countParams, countQuery, query, queryParams } = buildV1UsersListQueries(listParams);

  const client = await getPool().connect();
  try {
    const result = await client.query(query, queryParams);
    const countResult = await client.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count, 10);

    const users = (result.rows as V1UserRow[]).map(row => ({
      ...row,
    }));

    return SimpleErrorHandler.createSuccessResponse(req, {
      users,
      total,
      page: listParams.page,
      limit: listParams.limit,
    }, 200);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return SimpleErrorHandler.handleApiError(req, createInternalServerError(`Error fetching users: ${errorMessage}`));
  } finally {
    client.release();
  }
}

export async function POST(req: NextRequest) {
  const access = await authorizeV1UsersRequest(
    req,
    'USERS_CREATE',
    'Insufficient permissions to create users',
  );
  if (!access.ok) {
    return access.response;
  }
  const { user } = access;

  const bodyResult = await readRequestJsonResult(req);
  if (!bodyResult.ok) {
    return SimpleErrorHandler.handleApiError(req, createValidationError('Invalid JSON body'));
  }

  const body = bodyResult.value;
  const validationResult = createUserSchema.safeParse(body);
  if (!validationResult.success) {
    const errorMsg = formatCreateUserValidationError(validationResult.error);
    return SimpleErrorHandler.handleApiError(req, createValidationError(`Invalid input - ${errorMsg}`));
  }

  const validatedData = validationResult.data;
  const name = validatedData.name;
  const email = validatedData.email;
  const role = validatedData.role;
  const password = validatedData.password;

  const client = await getPool().connect();
  try {
    // Check if user already exists
    const existingResult = await client.query('SELECT id FROM "User" WHERE email = $1', [email]);
    if (existingResult.rows.length > 0) {
      return SimpleErrorHandler.handleApiError(req, createConflictError('User with this email already exists'));
    }

    // Create new user
    const insertQuery = `
      INSERT INTO "User" (id, name, email, role, password, "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      RETURNING id, name, email, role, "createdAt", "updatedAt";
    `;

    const newUserId = createV1UserId();
    const result = await client.query(insertQuery, [
      newUserId,
      name,
      email,
      role,
      password || null
    ]);

    const newUser = result.rows[0];
    const actingUserName = getV1ActingUserName(user);
    await logAudit('AUDIT', `User '${name}' created by ${actingUserName}.`, 'API:V1:Users:Create', user.id, { userId: newUserId, name, email, role });
    return SimpleErrorHandler.createSuccessResponse(req, {
      message: 'User created successfully',
      user: {
        ...newUser,
      }
    }, 201);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const actingUserName = getV1ActingUserName(user);
    await logAudit('ERROR', `Failed to create user by ${actingUserName}. Error: ${errorMessage}`, 'API:V1:Users:Create', user?.id, {
      error: errorMessage,
      ...(isJsonObject(body) ? body : { requestBody: body }),
    });
    return SimpleErrorHandler.handleApiError(req, createInternalServerError(`Error creating user: ${errorMessage}`));
  } finally {
    client.release();
  }
}

export async function OPTIONS(request: NextRequest) {
  const headers = handleCors(request);
  return new Response(null, { status: 200, headers });
} 
