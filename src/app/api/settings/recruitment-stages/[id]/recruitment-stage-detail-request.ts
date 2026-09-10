import { NextResponse, type NextRequest } from 'next/server';
import { validateUuid } from '@/lib/security';
import { readRequestJsonResult } from '@/lib/request-json';
import {
  type RecruitmentStageDetailRouteContext,
  updateRecruitmentStageSchema,
} from './recruitment-stage-detail-schema';

export async function resolveRecruitmentStageId(
  request: NextRequest,
  context?: RecruitmentStageDetailRouteContext,
  operation = 'request'
) {
  const routeParams = context?.params ? await context.params : null;
  const id = routeParams?.id ?? request.nextUrl.pathname.match(/\/recruitment-stages\/([^/]+)/)?.[1] ?? null;

  if (!id) {
    return {
      ok: false as const,
      response: NextResponse.json({ message: 'Invalid recruitment stage ID' }, { status: 400 }),
    };
  }

  if (!validateUuid(id)) {
    console.error(`[SECURITY] Invalid UUID format in recruitment-stages ${operation} request:`, id);
    return {
      ok: false as const,
      response: NextResponse.json({ message: 'Invalid recruitment stage ID format' }, { status: 400 }),
    };
  }

  return { ok: true as const, id };
}

export async function parseRecruitmentStageUpdateBody(request: NextRequest) {
  const bodyResult = await readRequestJsonResult(request);
  if (!bodyResult.ok) {
    return {
      ok: false as const,
      response: NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 }),
      body: null,
    };
  }

  const body = bodyResult.value;
  const validation = updateRecruitmentStageSchema.safeParse(body);
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

  if (Object.keys(validation.data).length === 0) {
    return {
      ok: false as const,
      response: NextResponse.json({ message: 'No fields to update' }, { status: 400 }),
      body,
    };
  }

  return { ok: true as const, body, data: validation.data };
}
