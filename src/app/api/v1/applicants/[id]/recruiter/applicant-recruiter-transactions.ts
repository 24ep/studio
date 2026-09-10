import { type NextRequest } from 'next/server';
import {
  createNotFoundError,
  createValidationError,
  SimpleErrorHandler,
} from '@/lib/errors';
import {
  getApplicantRecruiterActingUserName,
  requireApplicantRecruiterOwnershipPermission,
  type ApplicantRecruiterApiUser,
} from './applicant-recruiter-auth';
import {
  clearApplicantRecruiter,
  type DbClient,
  fetchApplicantForRecruiterUpdate,
  fetchApplicantPositionId,
  fetchRecruiterCandidate,
  fetchUpdatedApplicantRecruiter,
  insertRecruiterTransition,
  serializeApplicantRecruiter,
  updateApplicantRecruiter,
} from './applicant-recruiter-data';
import { logApplicantRecruiterSuccess } from './applicant-recruiter-audit';
import { buildRecruiterChangeNotes } from './applicant-recruiter-transition';

export async function updateApplicantRecruiterInTransaction({
  client,
  recruiterId,
  req,
  targetApplicantId,
  user,
}: {
  client: DbClient;
  recruiterId: string | null;
  req: NextRequest;
  targetApplicantId: string;
  user: ApplicantRecruiterApiUser;
}) {
  await client.query('BEGIN');

  const applicant = await fetchApplicantForRecruiterUpdate(client, targetApplicantId);
  if (!applicant) {
    await client.query('ROLLBACK');
    return SimpleErrorHandler.handleApiError(req, createNotFoundError('Applicant not found'));
  }

  const oldRecruiterId = applicant.recruiterId;
  const ownershipError = requireApplicantRecruiterOwnershipPermission(req, user, oldRecruiterId);
  if (ownershipError) {
    await client.query('ROLLBACK');
    return ownershipError;
  }

  if (recruiterId) {
    const recruiterValidationError = await validateRecruiterCandidate(client, req, recruiterId);
    if (recruiterValidationError) {
      await client.query('ROLLBACK');
      return recruiterValidationError;
    }
  }

  await updateApplicantRecruiter(client, targetApplicantId, recruiterId);
  await insertRecruiterChangeTransition({
    actingUserId: user.id,
    client,
    newRecruiterId: recruiterId,
    oldRecruiterId,
    targetApplicantId,
  });

  await client.query('COMMIT');

  const updatedApplicant = await fetchUpdatedApplicantRecruiter(client, targetApplicantId);
  await logApplicantRecruiterSuccess(
    `Applicant '${applicant.name}' recruiter updated by ${getApplicantRecruiterActingUserName(user)}.`,
    'API:V1:Applicants:UpdateRecruiter',
    user.id,
    {
      applicantId: targetApplicantId,
      oldRecruiterId,
      newRecruiterId: recruiterId,
    }
  );

  return SimpleErrorHandler.createSuccessResponse(req, {
    message: 'Applicant recruiter updated successfully',
    applicant: {
      id: updatedApplicant.id,
      name: updatedApplicant.name,
      recruiter: updatedApplicant.recruiterId ? serializeApplicantRecruiter(updatedApplicant) : null,
    },
  }, 200);
}

export async function deleteApplicantRecruiterInTransaction({
  client,
  req,
  targetApplicantId,
  user,
}: {
  client: DbClient;
  req: NextRequest;
  targetApplicantId: string;
  user: ApplicantRecruiterApiUser;
}) {
  await client.query('BEGIN');

  const applicant = await fetchApplicantForRecruiterUpdate(client, targetApplicantId);
  if (!applicant) {
    await client.query('ROLLBACK');
    return SimpleErrorHandler.handleApiError(req, createNotFoundError('Applicant not found'));
  }

  if (!applicant.recruiterId) {
    await client.query('ROLLBACK');
    return SimpleErrorHandler.handleApiError(req, createValidationError('Applicant has no recruiter assigned'));
  }

  await clearApplicantRecruiter(client, targetApplicantId);

  const positionId = await fetchApplicantPositionId(client, targetApplicantId);
  await insertRecruiterTransition(client, {
    applicantId: targetApplicantId,
    positionId,
    notes: 'Recruiter unassigned',
    actingUserId: user.id,
  });

  await client.query('COMMIT');

  await logApplicantRecruiterSuccess(
    `Applicant '${applicant.name}' recruiter unassigned by ${getApplicantRecruiterActingUserName(user)}.`,
    'API:V1:Applicants:UnassignRecruiter',
    user.id,
    {
      applicantId: targetApplicantId,
      oldRecruiterId: applicant.recruiterId,
    }
  );

  return SimpleErrorHandler.createSuccessResponse(req, {
    message: 'Applicant recruiter unassigned successfully',
  }, 200);
}

async function validateRecruiterCandidate(
  client: DbClient,
  req: NextRequest,
  recruiterId: string
) {
  const recruiter = await fetchRecruiterCandidate(client, recruiterId);
  if (!recruiter) {
    return SimpleErrorHandler.handleApiError(req, createValidationError('Recruiter not found'));
  }

  if (recruiter.role !== 'Recruiter' && recruiter.role !== 'Admin') {
    return SimpleErrorHandler.handleApiError(req, createValidationError('User is not a recruiter'));
  }

  return null;
}

async function insertRecruiterChangeTransition({
  actingUserId,
  client,
  newRecruiterId,
  oldRecruiterId,
  targetApplicantId,
}: {
  actingUserId: string;
  client: DbClient;
  newRecruiterId: string | null;
  oldRecruiterId: string | null;
  targetApplicantId: string;
}) {
  const positionId = await fetchApplicantPositionId(client, targetApplicantId);
  const notes = await buildRecruiterChangeNotes(client, newRecruiterId, oldRecruiterId);
  if (!notes) {
    return;
  }

  await insertRecruiterTransition(client, {
    applicantId: targetApplicantId,
    positionId,
    notes,
    actingUserId,
  });
}
