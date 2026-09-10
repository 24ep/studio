import { NextResponse, type NextRequest } from 'next/server';
import { readRequestJsonResult } from '@/lib/request-json';
import { bulkPositionActionSchema } from './position-bulk-action-schema';

export async function parsePositionBulkActionBody(request: NextRequest) {
  const result = await readRequestJsonResult(request);
  if (!result.ok) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { message: 'Error parsing request body', error: result.error instanceof Error ? result.error.message : String(result.error) },
        { status: 400 }
      ),
    };
  }

  return {
    ok: true as const,
    body: result.value,
  };
}

export function validatePositionBulkActionBody(body: unknown) {
  const validationResult = bulkPositionActionSchema.safeParse(body);
  if (!validationResult.success) {
    return {
      ok: false as const,
      response: NextResponse.json(
        {
          message: 'Invalid input for bulk position action.',
          errors: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      ),
    };
  }

  return { ok: true as const, input: validationResult.data };
}
