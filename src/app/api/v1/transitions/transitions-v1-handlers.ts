import { type NextRequest } from 'next/server';
import {
  createInternalServerError,
  createValidationError,
  SimpleErrorHandler,
} from '@/lib/errors';
import { readRequestJsonResult } from '@/lib/request-json';
import { createV1Transition, fetchV1Transitions } from './transitions-v1-data';
import { requireV1TransitionUser } from './transitions-v1-auth';
import { createTransitionSchema } from './transitions-v1-schema';

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function formatZodErrors(errors: Array<{ path: Array<string | number>; message: string }>) {
  return errors.map((error) => `${error.path.join('.')}: ${error.message}`).join('; ');
}

export async function handleGetV1Transitions(request: NextRequest) {
  try {
    const authResult = await requireV1TransitionUser(request);
    if (!authResult.ok) {
      return authResult.response;
    }

    const { searchParams } = new URL(request.url);
    const response = await fetchV1Transitions({
      applicantId: searchParams.get('applicantId'),
      limit: parseInt(searchParams.get('limit') || '20', 10),
      offset: parseInt(searchParams.get('offset') || '0', 10),
    });

    return SimpleErrorHandler.createSuccessResponse(request, response, 200);
  } catch (error) {
    return SimpleErrorHandler.handleApiError(
      request,
      createInternalServerError(`Failed to fetch transitions: ${getErrorMessage(error)}`)
    );
  }
}

export async function handleCreateV1Transition(request: NextRequest) {
  try {
    const authResult = await requireV1TransitionUser(request);
    if (!authResult.ok) {
      return authResult.response;
    }

    const bodyResult = await readRequestJsonResult(request);
    if (!bodyResult.ok) {
      return SimpleErrorHandler.handleApiError(
        request,
        createValidationError('Invalid JSON body')
      );
    }

    const body = bodyResult.value;
    const validationResult = createTransitionSchema.safeParse(body);
    if (!validationResult.success) {
      return SimpleErrorHandler.handleApiError(
        request,
        createValidationError(`Invalid request body - ${formatZodErrors(validationResult.error.errors)}`)
      );
    }

    const newTransition = await createV1Transition(validationResult.data, authResult.user.id);

    return SimpleErrorHandler.createSuccessResponse(request, {
      message: 'Transition created successfully',
      data: newTransition,
    }, 201);
  } catch (error) {
    return SimpleErrorHandler.handleApiError(
      request,
      createInternalServerError(`Failed to create transition: ${getErrorMessage(error)}`)
    );
  }
}
