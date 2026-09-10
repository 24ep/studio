import { NextResponse, type NextRequest } from 'next/server';
import { readRequestJsonResult } from '@/lib/request-json';
import { createLogEntrySchema } from './logs-route-schema';

export async function parseCreateLogEntryBody(request: NextRequest) {
  let body: unknown;

  const bodyResult = await readRequestJsonResult(request);
  if (!bodyResult.ok) {
    console.error('Failed to parse log request body:', bodyResult.error);
    return {
      ok: false as const,
      response: NextResponse.json(
        { message: 'Error parsing request body', error: bodyResult.error instanceof Error ? bodyResult.error.message : String(bodyResult.error) },
        { status: 400 },
      ),
    };
  }

  body = bodyResult.value;
  const validationResult = createLogEntrySchema.safeParse(body);
  if (!validationResult.success) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { message: 'Invalid log entry data', errors: validationResult.error.flatten().fieldErrors },
        { status: 400 },
      ),
    };
  }

  return { ok: true as const, input: validationResult.data };
}
