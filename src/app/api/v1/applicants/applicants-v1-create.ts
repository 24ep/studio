import { type NextRequest } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import prisma from '@/lib/prisma';
import {
  SimpleErrorHandler,
  createInternalServerError,
  createValidationError,
} from '@/lib/errors';
import { logAudit } from '@/lib/auditLog';
import { requireV1ApplicantsUser } from './applicants-v1-auth';
import { buildApplicantCreatePayload } from './applicants-v1-payload';
import {
  autoAssignRecruiterToApplicant,
  buildApplicantCreateData,
  createInitialApplicantTransition,
  resolveAppliedStageId,
} from './applicants-v1-create-data';
import { parseCreateApplicantBody } from './applicants-v1-create-request';
import { asLogDetails, createApplicantResponse } from './applicants-v1-create-response';
import { enqueueAutomaticApplicantScreening } from '@/lib/screening/service';

export async function handleCreateV1Applicant(request: NextRequest) {
  const authorization = await requireV1ApplicantsUser(request, 'applicantS_CREATE');
  if (!authorization.ok) {
    return authorization.response;
  }

  const parsedBody = await parseCreateApplicantBody(request);
  if (!parsedBody.ok) {
    return parsedBody.response;
  }

  const resolvedStageId = await resolveAppliedStageId();
  if (!resolvedStageId) {
    return SimpleErrorHandler.handleApiError(request, createValidationError('Unable to resolve a valid recruitment stage ID'));
  }

  const applicantPayload = buildApplicantCreatePayload(parsedBody.data);
  const applicantId = uuidv4();

  try {
    const newApplicant = await prisma.applicant.create({
      data: buildApplicantCreateData({
        applicantId,
        resolvedStageId,
        input: parsedBody.data,
        payload: applicantPayload,
      }),
    });
    await createInitialApplicantTransition(applicantId, resolvedStageId, authorization.user.id);

    const actingUserName = (authorization.user.name || authorization.user.email || authorization.user.id || 'System') as string;
    await logAudit('AUDIT', `Applicant '${applicantPayload.name}' created by ${actingUserName}.`, 'API:V1:Applicants:Create', authorization.user.id, {
      applicantId,
      name: applicantPayload.name,
      email: applicantPayload.email,
      status: resolvedStageId,
    });

    const finalApplicant = await autoAssignRecruiterToApplicant(
      newApplicant,
      applicantId,
      applicantPayload.positionId,
      resolvedStageId,
      applicantPayload.name,
      authorization.user.id
    );
    await enqueueAutomaticApplicantScreening(applicantId).catch(error => console.error('[V1 Applicants] Automatic screening enqueue failed:', error));

    return SimpleErrorHandler.createSuccessResponse(request, {
      message: 'Applicant created successfully',
      applicant: createApplicantResponse(finalApplicant),
    }, 201);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const actingUserName = authorization.user ? (authorization.user.name || authorization.user.email || authorization.user.id || 'System') : 'Unknown';
    await logAudit('ERROR', `Failed to create Applicant by ${actingUserName}. Error: ${errorMessage}`, 'API:V1:Applicants:Create', authorization.user?.id, {
      error: errorMessage,
      ...asLogDetails(parsedBody.body),
    });
    return SimpleErrorHandler.handleApiError(request, createInternalServerError(`Error creating Applicant: ${errorMessage}`));
  }
}
