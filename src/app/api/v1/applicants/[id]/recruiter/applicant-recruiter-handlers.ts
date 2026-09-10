import { type NextRequest } from 'next/server';
import {
  createNotFoundError,
  createUnauthorizedError,
  SimpleErrorHandler,
} from '@/lib/errors';
import {
  authenticateApplicantRecruiterRequest,
  requireApplicantRecruiterDeletePermission,
  requireApplicantRecruiterUpdatePermission,
  requireApplicantRecruiterUser,
} from './applicant-recruiter-auth';
import {
  connectApplicantRecruiterClient,
  fetchApplicantRecruiter,
  serializeApplicantRecruiter,
} from './applicant-recruiter-data';
import {
  applicantRecruiterInternalError,
  rollbackApplicantRecruiterTransaction,
} from './applicant-recruiter-errors';
import {
  logFailureSafely,
} from './applicant-recruiter-audit';
import {
  parseApplicantRecruiterUpdateBody,
  resolveApplicantRecruiterId,
} from './applicant-recruiter-request';
import type { ApplicantRecruiterRouteContext } from './applicant-recruiter-schema';
import {
  deleteApplicantRecruiterInTransaction,
  updateApplicantRecruiterInTransaction,
} from './applicant-recruiter-transactions';

export async function handleGetApplicantRecruiter(req: NextRequest, context: ApplicantRecruiterRouteContext) {
  const user = await authenticateApplicantRecruiterRequest(req);
  const authError = requireApplicantRecruiterUser(req, user);
  if (authError) {
    return authError;
  }

  const targetApplicantId = await resolveApplicantRecruiterId(context);
  const client = await connectApplicantRecruiterClient();
  try {
    const applicant = await fetchApplicantRecruiter(client, targetApplicantId);
    if (!applicant) {
      return SimpleErrorHandler.handleApiError(req, createNotFoundError('Applicant not found'));
    }

    return SimpleErrorHandler.createSuccessResponse(req, {
      applicantId: applicant.id,
      recruiter: applicant.recruiterId ? serializeApplicantRecruiter(applicant) : null,
    }, 200);
  } catch (error) {
    return applicantRecruiterInternalError(req, 'fetching', error);
  } finally {
    client.release();
  }
}

export async function handleUpdateApplicantRecruiter(req: NextRequest, context: ApplicantRecruiterRouteContext) {
  const user = await authenticateApplicantRecruiterRequest(req);
  const authError = requireApplicantRecruiterUpdatePermission(req, user);
  if (authError) {
    return authError;
  }
  if (!user) {
    return SimpleErrorHandler.handleApiError(req, createUnauthorizedError('Authentication required'));
  }

  const targetApplicantId = await resolveApplicantRecruiterId(context);
  const parsedBody = await parseApplicantRecruiterUpdateBody(req);
  if (!parsedBody.ok) {
    return parsedBody.response;
  }

  const recruiterId = parsedBody.input.recruiterId;
  const client = await connectApplicantRecruiterClient();
  try {
    return await updateApplicantRecruiterInTransaction({
      client,
      recruiterId,
      req,
      targetApplicantId,
      user,
    });
  } catch (error) {
    await rollbackApplicantRecruiterTransaction(client);
    await logFailureSafely({
      action: 'UpdateRecruiter',
      applicantId: targetApplicantId,
      body: parsedBody.body,
      error,
      user,
    });
    return applicantRecruiterInternalError(req, 'updating', error);
  } finally {
    client.release();
  }
}

export async function handleDeleteApplicantRecruiter(req: NextRequest, context: ApplicantRecruiterRouteContext) {
  const user = await authenticateApplicantRecruiterRequest(req);
  const authError = requireApplicantRecruiterDeletePermission(req, user);
  if (authError) {
    return authError;
  }
  if (!user) {
    return SimpleErrorHandler.handleApiError(req, createUnauthorizedError('Authentication required'));
  }

  const targetApplicantId = await resolveApplicantRecruiterId(context);
  const client = await connectApplicantRecruiterClient();
  try {
    return await deleteApplicantRecruiterInTransaction({
      client,
      req,
      targetApplicantId,
      user,
    });
  } catch (error) {
    await rollbackApplicantRecruiterTransaction(client);
    await logFailureSafely({
      action: 'UnassignRecruiter',
      applicantId: targetApplicantId,
      error,
      user,
    });
    return applicantRecruiterInternalError(req, 'unassigning', error);
  } finally {
    client.release();
  }
}
