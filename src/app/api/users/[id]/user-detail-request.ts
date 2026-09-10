import { NextResponse, type NextRequest } from 'next/server';
import { validateUuid } from '@/lib/security';
import { securityConfig } from '@/lib/securityConfig';
import { readRequestJsonResult } from '@/lib/request-json';
import { type UserDetailRouteContext, updateUserSchema } from './user-detail-schema';

export async function resolveUserId(request: NextRequest, context?: UserDetailRouteContext) {
  const routeParams = context?.params ? await context.params : null;
  const id = routeParams?.id ?? request.nextUrl.pathname.match(/\/users\/([^/]+)/)?.[1] ?? null;

  if (!id) {
    return {
      ok: false as const,
      response: NextResponse.json({ message: 'Invalid user ID' }, { status: 400 }),
    };
  }

  if (!validateUuid(id)) {
    return {
      ok: false as const,
      id,
      response: NextResponse.json({ message: 'Invalid user ID format' }, { status: 400 }),
    };
  }

  return { ok: true as const, id };
}

export function logInvalidUserId(operation: string, id?: string) {
  if (id) {
    console.error(`[SECURITY] Invalid UUID format in users ${operation} request:`, id);
  }
}

export function validateUpdateUserBodySize(request: NextRequest) {
  const contentLength = request.headers.get('content-length');
  if (!contentLength) {
    return null;
  }

  const maxSize = securityConfig.requestBody?.maxJsonSize || 10 * 1024 * 1024;
  const size = parseInt(contentLength, 10);

  return size > maxSize
    ? NextResponse.json({
      message: `Request body too large. Maximum size is ${maxSize / (1024 * 1024)}MB`,
    }, { status: 413 })
    : null;
}

export async function parseUpdateUserBody(request: NextRequest) {
  const bodyResult = await readRequestJsonResult(request);
  if (!bodyResult.ok) {
    const errorMessage = bodyResult.error instanceof Error ? bodyResult.error.message : String(bodyResult.error);
    return {
      ok: false as const,
      response: NextResponse.json({ message: 'Error parsing request body', error: errorMessage }, { status: 400 }),
      body: null,
    };
  }

  const body = bodyResult.value;
  const validationResult = updateUserSchema.safeParse(body);
  if (!validationResult.success) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { message: 'Invalid input', errors: validationResult.error.flatten().fieldErrors },
        { status: 400 }
      ),
      body,
    };
  }

  return { ok: true as const, data: validationResult.data, body };
}
