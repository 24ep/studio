import { type NextRequest } from 'next/server';
import {
  SimpleErrorHandler,
  createValidationError,
} from '@/lib/errors';
import { readRequestJsonResult } from '@/lib/request-json';
import { createApplicantSchema } from './applicants-v1-schema';
import { cleanPayload } from './applicants-v1-payload';

export async function parseCreateApplicantBody(request: NextRequest) {
  const bodyResult = await readRequestJsonResult(request);
  if (!bodyResult.ok) {
    return {
      ok: false as const,
      response: SimpleErrorHandler.handleApiError(request, createValidationError('Invalid JSON body')),
      body: null,
    };
  }

  const body = cleanPayload(bodyResult.value);
  const validationResult = createApplicantSchema.safeParse(body);
  if (!validationResult.success) {
    const fieldErrors = validationResult.error.flatten().fieldErrors;
    const errorMsg = Object.entries(fieldErrors)
      .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
      .join('; ');

    console.error('Validation errors:', JSON.stringify(validationResult.error.flatten(), null, 2));
    console.error('Body that failed validation:', JSON.stringify(body, null, 2));

    return {
      ok: false as const,
      response: SimpleErrorHandler.handleApiError(request, createValidationError(`Invalid input - ${errorMsg}`)),
      body,
    };
  }

  return {
    ok: true as const,
    body,
    data: validationResult.data,
  };
}
