import { type NextRequest } from 'next/server';
import type { ZodError } from 'zod';

import {
  SimpleErrorHandler,
  createValidationError,
} from '@/lib/errors';
import { readRequestJsonResult } from '@/lib/request-json';

import {
  updateApplicantSchema,
  type UpdateApplicantInput,
} from './applicant-v1-detail-schema';

export type ParsedApplicantUpdateBody =
  | {
    ok: true;
    body: unknown;
    data: UpdateApplicantInput;
  }
  | {
    ok: false;
    body: unknown;
    response: Response;
  };

export async function parseUpdateBody(req: NextRequest): Promise<ParsedApplicantUpdateBody> {
  const bodyResult = await readRequestJsonResult(req);
  if (!bodyResult.ok) {
    return {
      ok: false,
      response: SimpleErrorHandler.handleApiError(req, createValidationError('Invalid JSON body')),
      body: null,
    };
  }

  const body = bodyResult.value;
  const validationResult = updateApplicantSchema.safeParse(body);
  if (!validationResult.success) {
    return {
      ok: false,
      response: SimpleErrorHandler.handleApiError(
        req,
        createValidationError(`Invalid input - ${formatUpdateValidationErrors(validationResult.error)}`)
      ),
      body,
    };
  }

  return {
    ok: true,
    body,
    data: validationResult.data,
  };
}

function formatUpdateValidationErrors(error: ZodError<UpdateApplicantInput>) {
  const fieldErrors = error.flatten().fieldErrors;
  return Object.entries(fieldErrors)
    .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
    .join('; ');
}
