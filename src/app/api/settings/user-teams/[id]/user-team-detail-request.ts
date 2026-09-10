import { NextResponse, type NextRequest } from 'next/server';
import { validateUuid } from '@/lib/security';
import { readRequestJsonResult } from '@/lib/request-json';
import { type UserTeamDetailRouteContext, userTeamUpdateSchema } from './user-team-detail-schema';

export async function resolveUserTeamId(request: NextRequest, context?: UserTeamDetailRouteContext) {
  const routeParams = context?.params ? await context.params : null;
  const id = routeParams?.id ?? request.nextUrl.pathname.match(/\/user-teams\/([^/]+)/)?.[1] ?? null;

  if (!id) {
    return {
      ok: false as const,
      response: NextResponse.json({ message: 'Invalid user team ID' }, { status: 400 }),
    };
  }

  if (!validateUuid(id)) {
    console.error('[SECURITY] Invalid UUID format in user-teams request:', id);
    return {
      ok: false as const,
      response: NextResponse.json({ message: 'Invalid user team ID format' }, { status: 400 }),
    };
  }

  return { ok: true as const, id };
}

export async function parseUserTeamUpdateBody(request: NextRequest) {
  const bodyResult = await readRequestJsonResult(request);
  if (!bodyResult.ok) {
    return {
      ok: false as const,
      response: NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 }),
      body: null,
    };
  }

  const body = bodyResult.value;
  const validation = userTeamUpdateSchema.safeParse(body);
  if (!validation.success) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { message: 'Invalid input', errors: validation.error.flatten().fieldErrors },
        { status: 400 }
      ),
      body,
    };
  }

  return { ok: true as const, body, data: validation.data };
}
