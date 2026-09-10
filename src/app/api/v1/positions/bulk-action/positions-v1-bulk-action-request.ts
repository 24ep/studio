import type { NextRequest } from 'next/server';
import { readRequestJsonResult } from '@/lib/request-json';
import { v1PositionBulkActionResponse } from './positions-v1-bulk-action-response';
import { v1PositionBulkActionSchema } from './positions-v1-bulk-action-schema';

export async function parseV1PositionBulkActionRequest(request: NextRequest) {
  const bodyResult = await readRequestJsonResult(request);
  if (!bodyResult.ok) {
    return {
      ok: false as const,
      response: v1PositionBulkActionResponse(request, { error: 'Invalid JSON body' }, 400),
    };
  }
  const body = bodyResult.value;

  const validationResult = v1PositionBulkActionSchema.safeParse(body);
  if (!validationResult.success) {
    return {
      ok: false as const,
      response: v1PositionBulkActionResponse(
        request,
        { error: 'Invalid input', details: validationResult.error.flatten().fieldErrors },
        400
      ),
    };
  }

  return { ok: true as const, input: validationResult.data };
}
