import { NextResponse } from 'next/server';
import type { SessionLikeUser } from '../../../../lib/permissions';
import { validateApplicantHeadcountForHire } from './applicant-detail-headcount-utils';
import {
  buildApplicantUpdateMutation,
  updateApplicantReadStatus,
  validateApplicantUpdateReferences,
} from './applicant-detail-route-utils';
import { validateApplicantUpdateOwnershipAccess } from './applicant-detail-update-auth';
import type { ApplicantDetailUpdateClient } from './applicant-detail-update-db';
import { fetchExistingApplicantForUpdate } from './applicant-detail-update-db';

type ApplicantUpdatePayload = Parameters<typeof buildApplicantUpdateMutation>[0];
export type ExistingApplicantForUpdate = NonNullable<Awaited<ReturnType<typeof fetchExistingApplicantForUpdate>>>;

export interface ApplicantUpdateSnapshot {
  oldPositionId: string | null;
  oldRecruiterId: string | null;
  oldStatus: unknown;
  pinChangeRequested: boolean;
  requestedRecruiterId: string | null | undefined;
}

export function buildApplicantUpdateSnapshot(
  updatePayload: ApplicantUpdatePayload,
  existingApplicant: ExistingApplicantForUpdate
): ApplicantUpdateSnapshot {
  const { recruiterId, isPinned } = updatePayload;

  return {
    oldPositionId: existingApplicant.positionId,
    oldRecruiterId: existingApplicant.recruiterId,
    oldStatus: existingApplicant.statusId,
    pinChangeRequested: typeof isPinned === 'boolean' && isPinned !== existingApplicant.isPinned,
    requestedRecruiterId: typeof recruiterId === 'string' || recruiterId === null ? recruiterId : undefined,
  };
}

export async function fetchExistingApplicantUpdateOrResponse({
  client,
  applicantId,
}: {
  client: ApplicantDetailUpdateClient;
  applicantId: string;
}) {
  const existingApplicant = await fetchExistingApplicantForUpdate(client, applicantId);
  if (existingApplicant) {
    return { existingApplicant };
  }

  await client.query('ROLLBACK');
  console.error('Applicant not found:', applicantId);
  return {
    response: NextResponse.json({ message: 'Applicant not found' }, { status: 404 }),
  };
}

function logReferenceValidationFailure(validation: Exclude<
  Awaited<ReturnType<typeof validateApplicantUpdateReferences>>,
  { valid: true }
>) {
  if (validation.logError !== undefined) {
    console.error(validation.logMessage, validation.logError);
  } else if (validation.logMessage) {
    console.error(validation.logMessage);
  }
}

export async function validateApplicantUpdateGuards({
  actingUserId,
  actingUserName,
  applicantId,
  client,
  existingApplicant,
  sessionUser,
  updatePayload,
  oldStatus,
  validateHiringStatus,
}: {
  actingUserId: string;
  actingUserName: string;
  applicantId: string;
  client: ApplicantDetailUpdateClient;
  existingApplicant: ExistingApplicantForUpdate;
  sessionUser: SessionLikeUser;
  updatePayload: ApplicantUpdatePayload;
  oldStatus: unknown;
  validateHiringStatus: Parameters<typeof validateApplicantHeadcountForHire>[0]['validateHiringStatus'];
}) {
  const { positionId, recruiterId, sourceId, status } = updatePayload;

  const ownershipError = await validateApplicantUpdateOwnershipAccess({
    client,
    sessionUser,
    recruiterId: existingApplicant.recruiterId,
    actingUserId,
    actingUserName,
    status,
    oldStatus,
  });
  if (ownershipError) {
    return ownershipError;
  }

  const referenceValidation = await validateApplicantUpdateReferences({
    client,
    positionId,
    recruiterId,
    sourceId,
    status,
  });
  if (!referenceValidation.valid) {
    await client.query('ROLLBACK');
    logReferenceValidationFailure(referenceValidation);
    return NextResponse.json(
      { message: referenceValidation.message },
      { status: referenceValidation.status }
    );
  }

  const headcountGuard = await validateApplicantHeadcountForHire({
    client,
    applicantId,
    positionId: existingApplicant.positionId,
    nextStatus: status,
    previousStatus: oldStatus,
    validateHiringStatus,
  });
  if (!headcountGuard.ok) {
    await client.query('ROLLBACK');
    if (headcountGuard.error) {
      const isValidationError = headcountGuard.body.reason === 'VALIDATION_ERROR';
      console.error(
        isValidationError
          ? 'Error validating headcount for hiring:'
          : 'Error getting stage name for headcount validation:',
        headcountGuard.error
      );
    }
    return NextResponse.json(headcountGuard.body, { status: headcountGuard.status });
  }

  return null;
}

export async function applyApplicantUpdateMutation({
  actingUserId,
  applicantId,
  client,
  isRead,
  updatePayload,
}: {
  actingUserId: string;
  applicantId: string;
  client: ApplicantDetailUpdateClient;
  isRead: unknown;
  updatePayload: ApplicantUpdatePayload;
}) {
  const updateMutation = buildApplicantUpdateMutation(updatePayload, applicantId);
  const newReadStatus = typeof isRead === 'boolean'
    ? await updateApplicantReadStatus({
      client,
      applicantId,
      userId: actingUserId,
      isRead,
    })
    : undefined;

  const updateResult = await client.query(updateMutation.query, updateMutation.values);
  if (updateResult.rows.length === 0) {
    throw new Error('Failed to update Applicant - no rows returned');
  }

  return { newReadStatus };
}
