import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import type { NextRequest } from "next/server";

import { verifyApiToken } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import {
  createForbiddenError,
  createUnauthorizedError,
  SimpleErrorHandler,
} from "@/lib/errors";

export const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  role: z.enum(["Admin", "Recruiter", "User"]),
  password: z.string().min(8).optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

export type V1UserRow = {
  id: string;
  name: string | null;
  email: string;
  role: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
};

export type V1AuthenticatedUser = NonNullable<Awaited<ReturnType<typeof verifyApiToken>>>;

export async function authorizeV1UsersRequest(
  req: NextRequest,
  permission: "USERS_VIEW" | "USERS_CREATE",
  forbiddenMessage: string,
) {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.split(" ")[1];
  const user = token ? await verifyApiToken(token) : null;

  if (!user) {
    return {
      ok: false as const,
      response: SimpleErrorHandler.handleApiError(req, createUnauthorizedError("Authentication required")),
    };
  }

  if (!hasPermission(user, permission)) {
    return {
      ok: false as const,
      response: SimpleErrorHandler.handleApiError(req, createForbiddenError(forbiddenMessage)),
    };
  }

  return {
    ok: true as const,
    user,
  };
}

export function parseV1UsersListParams(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "10", 10);

  return {
    limit,
    offset: (page - 1) * limit,
    page,
    roleFilter: searchParams.get("role"),
    searchTerm: searchParams.get("searchTerm"),
  };
}

export function buildV1UsersListQueries({
  limit,
  offset,
  roleFilter,
  searchTerm,
}: ReturnType<typeof parseV1UsersListParams>) {
  const whereClauses: string[] = [];
  const filterParams: string[] = [];
  let paramIndex = 1;

  if (roleFilter) {
    whereClauses.push(`role = $${paramIndex++}`);
    filterParams.push(roleFilter);
  }

  if (searchTerm) {
    whereClauses.push(`(name ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`);
    filterParams.push(`%${searchTerm}%`);
    paramIndex++;
  }

  const whereSql = whereClauses.length > 0 ? ` WHERE ${whereClauses.join(" AND ")}` : "";
  const queryParams: Array<string | number> = [...filterParams, limit, offset];

  return {
    countQuery: `SELECT COUNT(*) FROM "User"${whereSql}`,
    countParams: filterParams,
    query: `SELECT id, name, email, role, "createdAt", "updatedAt" FROM "User"${whereSql} ORDER BY "createdAt" DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
    queryParams,
  };
}

export function formatCreateUserValidationError(error: z.ZodError<CreateUserInput>) {
  const fieldErrors = error.flatten().fieldErrors;
  return Object.entries(fieldErrors)
    .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(", ") : errors}`)
    .join("; ");
}

export function createV1UserId() {
  return uuidv4();
}

export function getV1ActingUserName(user: V1AuthenticatedUser) {
  return (user.name || user.email || user.id || "System") as string;
}
