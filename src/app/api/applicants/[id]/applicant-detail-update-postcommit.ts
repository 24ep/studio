import { logAudit } from '@/lib/auditLog';
import { broadcastApplicantStatusChanged, broadcastApplicantUpdate } from '@/lib/simple-broadcaster';
import { syncRecruiterForApplicant } from '@/lib/recruiterSync';
import {
  buildApplicantUpdateResponseData,
  fetchApplicantPostUpdateResponseParts,
  shouldBroadcastApplicantStatusChange,
  shouldSyncRecruiterAfterPositionChange,
} from './applicant-detail-route-utils';
import type { ApplicantDetailUpdateClient } from './applicant-detail-update-db';

export async function syncRecruiterAfterApplicantPositionChange({
  applicantId,
  requestedPositionId,
  previousPositionId,
  requestedRecruiterId,
  actingUserId,
  actingUserName,
}: {
  applicantId: string;
  requestedPositionId: unknown;
  previousPositionId: string | null;
  requestedRecruiterId: string | null | undefined;
  actingUserId: string;
  actingUserName: string;
}) {
  const requestedSyncPositionId = typeof requestedPositionId === 'string' ? requestedPositionId : undefined;
  if (!requestedSyncPositionId || !shouldSyncRecruiterAfterPositionChange({
    nextPositionId: requestedSyncPositionId,
    previousPositionId,
    explicitRecruiterId: requestedRecruiterId,
  })) {
    return null;
  }

  try {
    const syncSuccess = await syncRecruiterForApplicant(
      applicantId,
      requestedSyncPositionId,
      actingUserId,
      actingUserName
    );
    return syncSuccess ? { synced: true, message: 'Recruiter auto-assigned from position' } : null;
  } catch (syncError) {
    console.error('Failed to assign recruiter after position assignment:', syncError);
    return null;
  }
}

export async function logApplicantUpdateAudits({
  applicantId,
  applicantName,
  actingUserId,
  actingUserName,
  oldStatus,
  status,
  pinChangeRequested,
  isPinned,
}: {
  applicantId: string;
  applicantName: string;
  actingUserId: string;
  actingUserName: string;
  oldStatus: unknown;
  status: unknown;
  pinChangeRequested: boolean;
  isPinned: unknown;
}) {
  try {
    await logAudit(
      'AUDIT',
      `Applicant '${applicantName}' updated by ${actingUserName}.`,
      'API:Applicants:Update',
      actingUserId,
      { applicantId, oldStatus, newStatus: status ?? 'Applied' }
    );
  } catch (auditError) {
    console.error('Failed to log audit entry:', auditError);
  }

  if (!pinChangeRequested) {
    return;
  }

  try {
    await logAudit(
      'AUDIT',
      `Applicant '${applicantName}' ${isPinned ? 'pinned' : 'unpinned'} by ${actingUserName}.`,
      'API:Applicants:PinToggle',
      actingUserId,
      { applicantId, isPinned }
    );
  } catch {
    // Preserve existing behavior: pin audit failures do not fail the update.
  }
}

export async function buildApplicantPostUpdateResponse({
  client,
  applicantId,
  actingUserId,
  isJobMatchEnabled,
  newReadStatus,
  oldStatus,
  status,
  recruiterSync,
  headcountAssignment,
}: {
  client: ApplicantDetailUpdateClient;
  applicantId: string;
  actingUserId: string;
  isJobMatchEnabled: boolean;
  newReadStatus: boolean | undefined;
  oldStatus: unknown;
  status: unknown;
  recruiterSync: unknown;
  headcountAssignment: unknown;
}) {
  const {
    applicant,
    customAttributes,
    jobMatches,
    attachments,
    userReadStatus,
    companyReferences,
  } = await fetchApplicantPostUpdateResponseParts({
    client,
    applicantId,
    actingUserId,
    isJobMatchEnabled,
    newReadStatus,
  });

  try {
    broadcastApplicantUpdate({ ...applicant, customAttributes }, actingUserId);

    if (typeof oldStatus === 'string' && shouldBroadcastApplicantStatusChange(oldStatus, status)) {
      broadcastApplicantStatusChanged({ ...applicant, customAttributes }, oldStatus, status, actingUserId);
    }
  } catch (broadcastError) {
    console.error('Failed to broadcast Applicant update:', broadcastError);
  }

  return buildApplicantUpdateResponseData({
    applicant,
    customAttributes,
    jobMatches,
    attachments,
    userReadStatus,
    companyReferences,
    recruiterSync,
    headcountAssignment,
  });
}
