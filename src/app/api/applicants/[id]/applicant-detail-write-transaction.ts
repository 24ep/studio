import { NextResponse } from 'next/server';
import { validateApplicantHiringStatus } from '@/lib/headcountUtils';
import {
  buildApplicantUpdateMutation,
} from './applicant-detail-route-utils';
import { fetchApplicantRecruiterChangeDetails } from './applicant-detail-transition-utils';
import type { ApplicantDetailUpdateClient } from './applicant-detail-update-db';
import {
  buildApplicantPostUpdateResponse,
  logApplicantUpdateAudits,
  syncRecruiterAfterApplicantPositionChange,
} from './applicant-detail-update-postcommit';
import {
  broadcastApplicantPositionHeadcountChanges,
  runApplicantTransitionSideEffects,
} from './applicant-detail-update-side-effects';
import {
  applyApplicantUpdateMutation,
  buildApplicantUpdateSnapshot,
  fetchExistingApplicantUpdateOrResponse,
  validateApplicantUpdateGuards,
} from './applicant-detail-write-transaction-steps';
import {
  assignApplicantUpdateHeadcount,
  broadcastApplicantUpdateHeadcountChanges,
  resolveApplicantJobMatchEnabled,
  runApplicantUpdateTransitionEffects,
} from './applicant-detail-write-transaction-effects';
import type { SessionLikeUser } from '@/lib/permissions';

type ApplicantUpdatePayload = Parameters<typeof buildApplicantUpdateMutation>[0];

interface ExecuteApplicantDetailUpdateTransactionInput {
  actingUserId: string;
  actingUserName: string;
  applicantId: string;
  client: ApplicantDetailUpdateClient;
  isRead: unknown;
  sessionUser: SessionLikeUser;
  transitionNotes: string | null;
  updatePayload: ApplicantUpdatePayload;
}

export async function executeApplicantDetailUpdateTransaction({
  actingUserId,
  actingUserName,
  applicantId,
  client,
  isRead,
  sessionUser,
  transitionNotes,
  updatePayload,
}: ExecuteApplicantDetailUpdateTransactionInput) {
  const { positionId, recruiterId, status, isPinned } = updatePayload;

  const isJobMatchEnabled = await resolveApplicantJobMatchEnabled({
    onError: (settingError) => {
      console.error('Failed to get job match feature setting:', settingError);
    },
  });

  const existingApplicantResult = await fetchExistingApplicantUpdateOrResponse({ client, applicantId });
  if ('response' in existingApplicantResult) {
    return existingApplicantResult.response;
  }
  const { existingApplicant } = existingApplicantResult;
  const {
    oldPositionId,
    oldRecruiterId,
    oldStatus,
    pinChangeRequested,
    requestedRecruiterId,
  } = buildApplicantUpdateSnapshot(updatePayload, existingApplicant);

  const guardError = await validateApplicantUpdateGuards({
    actingUserId,
    actingUserName,
    applicantId,
    client,
    existingApplicant,
    sessionUser,
    updatePayload,
    oldStatus,
    validateHiringStatus: validateApplicantHiringStatus,
  });
  if (guardError) {
    return guardError;
  }

  const { newReadStatus } = await applyApplicantUpdateMutation({
    actingUserId,
    applicantId,
    client,
    isRead,
    updatePayload,
  });

  const recruiterChange = await fetchApplicantRecruiterChangeDetails({
    client,
    previousRecruiterId: oldRecruiterId,
    nextRecruiterId: recruiterId,
  });

  const headcountAssignment = await assignApplicantUpdateHeadcount({
    client,
    applicantId,
    positionId: existingApplicant.positionId,
    nextStatus: status,
    previousStatus: oldStatus,
    actingUserId,
    actingUserName,
  });
  if (!headcountAssignment.ok) {
    await client.query('ROLLBACK');
    return NextResponse.json(headcountAssignment.body, { status: headcountAssignment.status });
  }

  await broadcastApplicantUpdateHeadcountChanges({
    client,
    previousStatus: oldStatus,
    nextStatus: status,
  });

  await runApplicantUpdateTransitionEffects({
    client,
    applicantId,
    requestedPositionId: positionId,
    fallbackPositionId: existingApplicant.positionId,
    previousStatus: oldStatus,
    nextStatus: status,
    transitionNotes,
    recruiterChanged: recruiterChange.recruiterChanged,
    oldRecruiterId,
    newRecruiterId: recruiterId,
    oldRecruiterName: recruiterChange.oldRecruiterName,
    newRecruiterName: recruiterChange.newRecruiterName,
    actingUserId,
  });

  const syncResult = await syncRecruiterAfterApplicantPositionChange({
    applicantId,
    requestedPositionId: positionId,
    previousPositionId: oldPositionId,
    requestedRecruiterId,
    actingUserId,
    actingUserName,
  });

  await client.query('COMMIT');
  await logApplicantUpdateAudits({
    applicantId,
    applicantName: existingApplicant.name,
    actingUserId,
    actingUserName,
    oldStatus,
    status,
    pinChangeRequested,
    isPinned,
  });

  return NextResponse.json(await buildApplicantPostUpdateResponse({
    client,
    applicantId,
    actingUserId,
    isJobMatchEnabled,
    newReadStatus,
    oldStatus,
    status,
    recruiterSync: syncResult,
    headcountAssignment: headcountAssignment.headcountAssignment,
  }));
}
