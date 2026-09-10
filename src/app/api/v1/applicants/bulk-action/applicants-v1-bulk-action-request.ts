import { type NextRequest } from 'next/server';
import { readRequestJsonResult } from '@/lib/request-json';
import { v1BulkActionErrorResponse, v1BulkActionJsonResponse } from './applicants-v1-bulk-action-response';
import {
  v1ApplicantsBulkActionSchema,
  type V1ApplicantsBulkActionInput,
} from './applicants-v1-bulk-action-types';

export async function readV1BulkActionBody(request: NextRequest) {
  const bodyResult = await readRequestJsonResult(request);
  if (!bodyResult.ok) {
    return {
      ok: false as const,
      response: v1BulkActionErrorResponse(request, 'Invalid JSON body', 400),
    };
  }

  return { ok: true as const, body: bodyResult.value };
}

export function validateV1BulkActionBody(request: NextRequest, body: unknown) {
  const validation = v1ApplicantsBulkActionSchema.safeParse(body);
  if (!validation.success) {
    return {
      ok: false as const,
      response: v1BulkActionJsonResponse(
        request,
        { error: 'Invalid input', details: validation.error.flatten().fieldErrors },
        400
      ),
    };
  }

  return { ok: true as const, data: validation.data };
}

export function getMissingActionDataMessage(input: V1ApplicantsBulkActionInput) {
  if (input.action === 'update_status' && !input.data?.status) {
    return 'Status is required for update_status action';
  }

  if (input.action === 'assign_recruiter' && !input.data?.recruiterId) {
    return 'Recruiter ID is required for assign_recruiter action';
  }

  if (input.action === 'assign_position' && !input.data?.positionId) {
    return 'Position ID is required for assign_position action';
  }

  return null;
}
