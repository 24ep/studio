import { type NextRequest } from 'next/server';
import { normalizePayloadTypes } from '@/lib/apiUtils';
import { readRequestJsonResult } from '@/lib/request-json';
import { badRequestResponse } from './job-applied-v1-response';
import { jobAppliedSchema } from './job-applied-v1-schema';

export async function parseJobAppliedBody(request: NextRequest, normalizeBody: boolean) {
  const bodyResult = await readRequestJsonResult(request);
  if (!bodyResult.ok) {
    return {
      ok: false as const,
      response: badRequestResponse(request, { message: 'Invalid JSON body' }),
    };
  }

  const body = normalizeBody ? normalizePayloadTypes(bodyResult.value) : bodyResult.value;
  const validationResult = jobAppliedSchema.safeParse(body);
  if (!validationResult.success) {
    return {
      ok: false as const,
      response: badRequestResponse(request, validationResult.error.flatten().fieldErrors),
    };
  }

  return { ok: true as const, data: validationResult.data };
}
