import { NextResponse, type NextRequest } from 'next/server';
import { readRequestJsonResult } from '@/lib/request-json';
import {
  bodyConfigSchema,
  bodyConfigUpdateSchema,
  type BodyConfigInput,
  type BodyConfigUpdateInput,
} from './webhook-body-config-schema';

async function parseRequestJson(request: NextRequest) {
  const result = await readRequestJsonResult(request);
  if (!result.ok) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }),
    };
  }

  return {
    ok: true as const,
    body: result.value,
  };
}

export async function parseBodyConfigCreateBody(request: NextRequest) {
  const parsedJson = await parseRequestJson(request);
  if (!parsedJson.ok) {
    return parsedJson;
  }

  const validation = bodyConfigSchema.safeParse(parsedJson.body);
  if (!validation.success) {
    return invalidInput(validation.error.flatten().fieldErrors);
  }

  return {
    ok: true as const,
    data: validation.data satisfies BodyConfigInput,
  };
}

export async function parseBodyConfigUpdateBody(request: NextRequest) {
  const parsedJson = await parseRequestJson(request);
  if (!parsedJson.ok) {
    return parsedJson;
  }

  const validation = bodyConfigUpdateSchema.safeParse(parsedJson.body);
  if (!validation.success) {
    return invalidInput(validation.error.flatten().fieldErrors);
  }

  return {
    ok: true as const,
    data: validation.data satisfies BodyConfigUpdateInput,
  };
}

function invalidInput(details: Record<string, string[] | undefined>) {
  return {
    ok: false as const,
    response: NextResponse.json(
      {
        error: 'Invalid input',
        details,
      },
      { status: 400 },
    ),
  };
}
