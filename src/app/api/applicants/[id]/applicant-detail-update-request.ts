import { NextResponse, type NextRequest } from 'next/server';
import { readRequestJsonResult } from '@/lib/request-json';
import { buildApplicantUpdateRequestParts } from './applicant-detail-route-utils';

export async function readApplicantUpdateRequest(request: NextRequest) {
  const bodyResult = await readRequestJsonResult(request);
  if (!bodyResult.ok) {
    console.error('Failed to parse request body:', bodyResult.error);
    return {
      ok: false as const,
      response: NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 }),
    };
  }

  const body = bodyResult.value;
  const requestParts = buildApplicantUpdateRequestParts(body);

  return { ok: true as const, body, ...requestParts };
}
