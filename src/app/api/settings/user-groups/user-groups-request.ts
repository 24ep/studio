import { NextResponse, type NextRequest } from 'next/server';
import { readRequestJsonResult } from '@/lib/request-json';
import { userGroupCreateSchema } from './user-groups-schema';

export async function parseUserGroupCreateBody(request: NextRequest) {
  const bodyResult = await readRequestJsonResult(request);
  if (!bodyResult.ok) {
    return {
      ok: false as const,
      response: NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 }),
    };
  }

  const body = bodyResult.value;
  const validation = userGroupCreateSchema.safeParse(body);
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
