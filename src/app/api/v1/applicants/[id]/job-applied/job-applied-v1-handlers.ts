import { type NextRequest } from 'next/server';
import {
  requireJobAppliedV1User,
  validateApplicantOwnershipAccess,
  validateInitialJobAppliedEditAccess,
} from './job-applied-v1-auth';
import {
  deleteApplicantJobApplied,
  fetchApplicantJobApplied,
  updateApplicantJobApplied,
} from './job-applied-v1-data';
import { parseJobAppliedBody } from './job-applied-v1-request';
import { jsonResponse, optionsResponse } from './job-applied-v1-response';
import type { JobAppliedV1RouteContext } from './job-applied-v1-schema';

export async function handleGetJobAppliedV1(request: NextRequest, { params }: JobAppliedV1RouteContext) {
  const authorization = await requireJobAppliedV1User(request);
  if (!authorization.ok) {
    return authorization.response;
  }

  const { id } = await params;
  try {
    const result = await fetchApplicantJobApplied(id);
    return result.status === 'not-found'
      ? jsonResponse(request, { error: 'Applicant not found' }, 404)
      : jsonResponse(request, result.data);
  } catch (error) {
    return jsonResponse(
      request,
      { error: 'Error fetching job_applied data', details: (error as Error).message },
      500
    );
  }
}

export async function handleSaveJobAppliedV1(
  request: NextRequest,
  context: JobAppliedV1RouteContext,
  { normalizeBody }: { normalizeBody: boolean }
) {
  const authorization = await requireJobAppliedV1User(request);
  if (!authorization.ok) {
    return authorization.response;
  }

  const initialAccess = validateInitialJobAppliedEditAccess(request, authorization.user);
  if (!initialAccess.ok) {
    return initialAccess.response;
  }

  const { id } = await context.params;
  const parsedBody = await parseJobAppliedBody(request, normalizeBody);
  if (!parsedBody.ok) {
    return parsedBody.response;
  }

  try {
    const result = await updateApplicantJobApplied(
      id,
      parsedBody.data,
      (applicant) => validateApplicantOwnershipAccess(
        request,
        authorization.user,
        applicant.recruiterId,
        initialAccess.permissions.hasGlobalSensitiveEditPermission
      )
    );
    if (result.status === 'applicant-not-found') {
      return jsonResponse(request, { error: 'Applicant not found' }, 404);
    }

    if (result.status === 'forbidden') {
      return result.response;
    }

    if (result.status === 'position-not-found') {
      return jsonResponse(request, { error: 'Position not found' }, 404);
    }

    return jsonResponse(request, {
      message: 'Job applied data updated successfully',
      ...result.data,
    });
  } catch (error) {
    return jsonResponse(
      request,
      { error: 'Error updating job_applied data', details: (error as Error).message },
      500
    );
  }
}

export async function handleDeleteJobAppliedV1(request: NextRequest, { params }: JobAppliedV1RouteContext) {
  const authorization = await requireJobAppliedV1User(request);
  if (!authorization.ok) {
    return authorization.response;
  }

  const initialAccess = validateInitialJobAppliedEditAccess(request, authorization.user);
  if (!initialAccess.ok) {
    return initialAccess.response;
  }

  const { id } = await params;
  try {
    const result = await deleteApplicantJobApplied(
      id,
      (applicant) => validateApplicantOwnershipAccess(
        request,
        authorization.user,
        applicant.recruiterId,
        initialAccess.permissions.hasGlobalSensitiveEditPermission
      )
    );
    if (result.status === 'applicant-not-found') {
      return jsonResponse(request, { error: 'Applicant not found' }, 404);
    }

    if (result.status === 'forbidden') {
      return result.response;
    }

    return jsonResponse(request, { message: 'Job applied data deleted successfully' });
  } catch (error) {
    return jsonResponse(
      request,
      { error: 'Error deleting job_applied data', details: (error as Error).message },
      500
    );
  }
}

export function handleJobAppliedV1Options(request: NextRequest) {
  return optionsResponse(request);
}
