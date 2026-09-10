import { type NextRequest } from 'next/server';
import { getJsonString } from '@/lib/json-types';
import { readRequestJsonObject } from '@/lib/request-json';
import { clearDuplicatesErrorResponse } from './clear-duplicates-response';

export async function parseClearDuplicatesRequest(request: NextRequest) {
  const body = await readRequestJsonObject(request);
  const dryRun = typeof body.dryRun === 'boolean' ? body.dryRun : false;
  const positionId = getJsonString(body, 'positionId');

  if (body.positionId !== undefined && !positionId) {
    return {
      ok: false as const,
      response: clearDuplicatesErrorResponse(request, 'Invalid positionId format', 400),
    };
  }

  if (body.dryRun !== undefined && typeof body.dryRun !== 'boolean') {
    return {
      ok: false as const,
      response: clearDuplicatesErrorResponse(request, 'Invalid dryRun format - must be boolean', 400),
    };
  }

  return { ok: true as const, dryRun, positionId };
}
