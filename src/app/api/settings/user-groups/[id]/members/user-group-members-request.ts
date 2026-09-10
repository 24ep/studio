import { NextResponse, type NextRequest } from 'next/server';
import { validateUuid } from '@/lib/security';
import { readRequestJsonResult } from '@/lib/request-json';
import { groupMemberSchema, type UserGroupMembersRouteContext } from './user-group-members-schema';

export async function extractGroupIdFromRequest(request: NextRequest, context?: UserGroupMembersRouteContext) {
  const routeParams = context?.params ? await context.params : null;
  return routeParams?.id ?? request.nextUrl.pathname.match(/\/user-groups\/([^/]+)\/members/)?.[1] ?? null;
}

export async function resolveGroupId(request: NextRequest, context?: UserGroupMembersRouteContext) {
  const groupId = await extractGroupIdFromRequest(request, context);

  if (!groupId) {
    return {
      ok: false as const,
      response: NextResponse.json({ message: 'Invalid group ID' }, { status: 400 }),
    };
  }

  if (!validateUuid(groupId)) {
    console.error('[SECURITY] Invalid UUID format in user-group members request:', groupId);
    return {
      ok: false as const,
      response: NextResponse.json({ message: 'Invalid group ID format' }, { status: 400 }),
    };
  }

  return { ok: true as const, groupId };
}

export async function parseAddMemberBody(request: NextRequest) {
  const bodyResult = await readRequestJsonResult(request);
  if (!bodyResult.ok) {
    return {
      ok: false as const,
      response: NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 }),
    };
  }

  const body = bodyResult.value;
  const validation = groupMemberSchema.safeParse(body);
  if (!validation.success) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { message: 'Invalid input', errors: validation.error.flatten().fieldErrors },
        { status: 400 }
      ),
    };
  }

  return { ok: true as const, input: validation.data };
}

export function parseRemoveMemberQuery(request: NextRequest) {
  const validation = groupMemberSchema.safeParse({
    userId: request.nextUrl.searchParams.get('userId'),
  });

  if (!validation.success) {
    return {
      ok: false as const,
      response: NextResponse.json({ message: 'Invalid group ID or user ID' }, { status: 400 }),
    };
  }

  return { ok: true as const, input: validation.data };
}
