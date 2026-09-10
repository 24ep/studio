import { NextRequest } from "next/server";
import { v4 as uuidv4 } from "uuid";

import { logAudit } from "@/lib/auditLog";
import { verifyApiToken } from "@/lib/auth";
import { handleCors } from "@/lib/cors";
import { getPool } from "@/lib/db";
import { readRequestJsonResult } from "@/lib/request-json";
import {
  SimpleErrorHandler,
  createForbiddenError,
  createInternalServerError,
  createUnauthorizedError,
  createValidationError,
} from "@/lib/errors";
import { hasPermission } from "@/lib/permissions";
import { getDefaultMatchCriteria } from "@/lib/systemSettings";

import {
  getCreatePositionValues,
  mapCreatedPositionRow,
  mapV1PositionRow,
  type V1PositionRow,
} from "./positions-v1-route-map";
import { buildV1PositionListQuery } from "./positions-v1-route-query";
import {
  createPositionSchema,
  formatCreatePositionValidationErrors,
} from "./positions-v1-route-schema";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const INSERT_POSITION_QUERY = `
  INSERT INTO "Position" (id, title, department, description, "matchCriteria", "isOpen", "positionLevel", "customAttributes", "createdAt", "updatedAt")
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
  RETURNING *;
`;

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

async function verifyBearerUser(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.split(" ")[1];

  return token ? verifyApiToken(token) : null;
}

export async function GET(req: NextRequest) {
  const user = await verifyBearerUser(req);
  if (!user) {
    return SimpleErrorHandler.handleApiError(req, createUnauthorizedError("Authentication required"));
  }

  try {
    const listQuery = buildV1PositionListQuery(new URL(req.url).searchParams);
    const result = await getPool().query<V1PositionRow>(listQuery.query, listQuery.queryParams);
    const countResult = await getPool().query<{ count: string }>(listQuery.countQuery, listQuery.countParams);
    const total = parseInt(countResult.rows[0].count, 10);
    const positions = result.rows.map(mapV1PositionRow);

    return SimpleErrorHandler.createSuccessResponse(req, { data: positions, total }, 200);
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    return SimpleErrorHandler.handleApiError(req, createInternalServerError(`Error fetching positions: ${errorMessage}`));
  }
}

export async function POST(req: NextRequest) {
  const user = await verifyBearerUser(req);
  if (!user || !hasPermission(user, "POSITIONS_CREATE")) {
    return SimpleErrorHandler.handleApiError(req, createForbiddenError("Insufficient permissions to create positions"));
  }

  const bodyResult = await readRequestJsonResult(req);
  if (!bodyResult.ok) {
    const errorMessage = getErrorMessage(bodyResult.error);
    return SimpleErrorHandler.handleApiError(req, createValidationError(`Error parsing request body: ${errorMessage}`));
  }
  const body = bodyResult.value;

  const validationResult = createPositionSchema.safeParse(body);
  if (!validationResult.success) {
    const errorMsg = formatCreatePositionValidationErrors(validationResult.error);
    return SimpleErrorHandler.handleApiError(req, createValidationError(`Invalid input - ${errorMsg}`));
  }

  const validatedData = validationResult.data;

  try {
    const defaultMatchCriteria = await getDefaultMatchCriteria();
    const newPositionId = uuidv4();
    const values = getCreatePositionValues(newPositionId, validatedData, defaultMatchCriteria);
    const result = await getPool().query(INSERT_POSITION_QUERY, values);
    const newPosition = mapCreatedPositionRow(result.rows[0]);

    const actingUserName = user.name || user.email || user.id || "System";
    await logAudit("AUDIT", `Position '${validatedData.title}' created by ${actingUserName}.`, "API:V1:Positions:Create", user.id, { positionId: newPositionId, ...validatedData });
    return SimpleErrorHandler.createSuccessResponse(req, newPosition, 201);
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    const actingUserName = user ? (user.name || user.email || user.id || "System") : "Unknown";
    await logAudit("ERROR", `Failed to create position by ${actingUserName}. Error: ${errorMessage}`, "API:V1:Positions:Create", user?.id, { error: errorMessage, body });
    return SimpleErrorHandler.handleApiError(req, createInternalServerError(`Error creating position: ${errorMessage}`));
  }
}

export async function OPTIONS(request: NextRequest) {
  const headers = handleCors(request);
  return new Response(null, { status: 200, headers });
}
