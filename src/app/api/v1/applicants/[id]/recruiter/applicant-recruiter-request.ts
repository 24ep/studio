import { type NextRequest } from 'next/server';
import {
  createValidationError,
  SimpleErrorHandler,
} from '@/lib/errors';
import {
  type ApplicantRecruiterRouteContext,
  updateRecruiterSchema,
} from './applicant-recruiter-schema';
import { readRequestJsonResult } from '@/lib/request-json';

export async function resolveApplicantRecruiterId(context: ApplicantRecruiterRouteContext) {
  return (await context.params).id;
}

export async function parseApplicantRecruiterUpdateBody(req: NextRequest) {
  const bodyResult = await readRequestJsonResult(req);
  if (!bodyResult.ok) {
    return {
      ok: false as const,
      body: undefined,
      response: SimpleErrorHandler.handleApiError(req, createValidationError('Invalid JSON body')),
    };
  }

  const body = bodyResult.value;
  const validationResult = updateRecruiterSchema.safeParse(body);
  if (!validationResult.success) {
    const fieldErrors = validationResult.error.flatten().fieldErrors;
    const errorMsg = Object.entries(fieldErrors)
      .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
      .join('; ');
    return {
      ok: false as const,
      body,
      response: SimpleErrorHandler.handleApiError(req, createValidationError(`Invalid input - ${errorMsg}`)),
    };
  }

  return { ok: true as const, body, input: validationResult.data };
}
