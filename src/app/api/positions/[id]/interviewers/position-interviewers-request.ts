import { NextResponse, type NextRequest } from 'next/server';
import { validateUuid } from '@/lib/security';
import { readRequestJsonResult } from '@/lib/request-json';
import { addInterviewerSchema, type PositionInterviewersRouteContext } from './position-interviewers-schema';

export async function resolvePositionInterviewerPositionId({ params }: PositionInterviewersRouteContext) {
  const { id } = await params;
  if (!id || id === 'null' || id === 'undefined' || !validateUuid(id)) {
    console.error('[Position Interviewers API] Invalid position ID:', id);
    return {
      ok: false as const,
      response: NextResponse.json({ message: 'Invalid position ID' }, { status: 400 }),
    };
  }

  return { ok: true as const, id };
}

export async function parseAddInterviewerBody(request: NextRequest) {
  const bodyResult = await readRequestJsonResult(request);
  if (!bodyResult.ok) {
    return {
      ok: false as const,
      response: NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 }),
      body: null,
    };
  }
  const body = bodyResult.value;

  const validationResult = addInterviewerSchema.safeParse(body);
  if (!validationResult.success) {
    const errorMessages = validationResult.error.flatten().fieldErrors;
    const firstError = Object.values(errorMessages)[0]?.[0] || 'Invalid input';
    return {
      ok: false as const,
      response: NextResponse.json({ message: firstError, errors: errorMessages }, { status: 400 }),
      body,
    };
  }

  const { userId } = validationResult.data;
  if (!userId || userId === 'null' || userId === 'undefined') {
    console.error('[Position Interviewers API] Invalid user ID:', userId);
    return {
      ok: false as const,
      response: NextResponse.json({ message: 'Invalid user ID' }, { status: 400 }),
      body,
    };
  }

  return { ok: true as const, body, data: validationResult.data };
}
