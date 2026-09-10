import { NextResponse, type NextRequest } from 'next/server';
import { readRequestJsonResult } from '@/lib/request-json';
import { addTeamMemberSchema, type UserTeamMembersRouteContext } from './user-team-members-schema';

export async function resolveTeamId(context: UserTeamMembersRouteContext) {
  const { id } = await context.params;
  return id;
}

export async function parseAddTeamMemberBody(request: NextRequest) {
  const bodyResult = await readRequestJsonResult(request);
  if (!bodyResult.ok) {
    return {
      ok: false as const,
      response: NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 }),
    };
  }

  const body = bodyResult.value;
  const validation = addTeamMemberSchema.safeParse(body);
  if (!validation.success) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { message: 'Invalid input', errors: validation.error.flatten().fieldErrors },
        { status: 400 },
      ),
    };
  }

  return { ok: true as const, input: validation.data };
}

export function parseRemoveTeamMemberQuery(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get('userId');

  if (!userId) {
    return {
      ok: false as const,
      response: new NextResponse('User ID is required', { status: 400 }),
    };
  }

  return { ok: true as const, userId };
}
