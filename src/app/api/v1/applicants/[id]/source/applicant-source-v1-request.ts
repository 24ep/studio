import { type NextRequest } from 'next/server';
import { SimpleErrorHandler, createValidationError } from '@/lib/errors';
import { readRequestJsonResult } from '@/lib/request-json';
import { updateApplicantSourceSchema } from './applicant-source-v1-schema';

function formatSourceValidationErrors(fieldErrors: Record<string, string[] | undefined>) {
  return Object.entries(fieldErrors)
    .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
    .join('; ');
}

export async function parseUpdateApplicantSourceBody(request: NextRequest) {
  const bodyResult = await readRequestJsonResult(request);
  if (!bodyResult.ok) {
    return {
      ok: false as const,
      response: SimpleErrorHandler.handleApiError(request, createValidationError('Invalid JSON body')),
    };
  }

  const body = bodyResult.value;
  const validationResult = updateApplicantSourceSchema.safeParse(body);
  if (!validationResult.success) {
    const errorMsg = formatSourceValidationErrors(validationResult.error.flatten().fieldErrors);
    return {
      ok: false as const,
      response: SimpleErrorHandler.handleApiError(request, createValidationError(`Invalid input - ${errorMsg}`)),
    };
  }

  return { ok: true as const, body, input: validationResult.data };
}
