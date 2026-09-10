import { NextResponse, type NextRequest } from 'next/server';
import { validateUuid } from '@/lib/security';
import { readRequestJsonResult } from '@/lib/request-json';
import { type UserGroupDetailRouteContext, userGroupUpdateSchema } from './user-group-detail-schema';

export async function resolveUserGroupId(request: NextRequest, context?: UserGroupDetailRouteContext) {
  const routeParams = context?.params ? await context.params : null;
  const id = routeParams?.id ?? request.nextUrl.pathname.match(/\/user-groups\/([^/]+)/)?.[1] ?? null;

  if (!id) {
    return {
      ok: false as const,
      response: NextResponse.json({ message: 'Invalid user group ID' }, { status: 400 }),
    };
  }

  if (!validateUuid(id)) {
    console.error('[SECURITY] Invalid UUID format in user-groups request:', id);
    return {
      ok: false as const,
      response: NextResponse.json({ message: 'Invalid user group ID format' }, { status: 400 }),
    };
  }

  return { ok: true as const, id };
}

export async function parseUserGroupUpdateBody(request: NextRequest) {
  const bodyResult = await readRequestJsonResult(request);
  if (!bodyResult.ok) {
    console.error('PUT /api/settings/user-groups/[id] - JSON parse error:', bodyResult.error);
    return {
      ok: false as const,
      response: NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 }),
      body: null,
    };
  }

  const body = bodyResult.value;
  const validation = userGroupUpdateSchema.safeParse(body);
  if (!validation.success) {
    console.error('PUT /api/settings/user-groups/[id] - Validation error:', validation.error.flatten().fieldErrors);
    return {
      ok: false as const,
      response: NextResponse.json(
        { message: 'Invalid input', errors: validation.error.flatten().fieldErrors },
        { status: 400 }
      ),
      body,
    };
  }

  return { ok: true as const, body, fields: validation.data };
}
