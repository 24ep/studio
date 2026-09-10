import { v4 as uuidv4 } from 'uuid';

import { assignApplicantToHeadcount, validateApplicantHiringStatus } from '@/lib/headcountUtils';
import { NotificationService } from '@/lib/notificationService';
import { getRecruitmentStageByName } from '@/lib/recruitmentStageUtils';
import {
  broadcastApplicantUpdate,
  broadcastPositionListUpdated,
  broadcastPositionStatisticsUpdated,
} from '@/lib/simple-broadcaster';
import { getSystemSetting } from '@/lib/systemSettings';

import { assignApplicantHeadcountAfterHire } from './applicant-detail-headcount-utils';
import { getApplicantJobMatchFeatureEnabled } from './applicant-detail-route-utils';
import type { ApplicantDetailUpdateClient } from './applicant-detail-update-db';
import {
  broadcastApplicantPositionHeadcountChanges,
  runApplicantTransitionSideEffects,
} from './applicant-detail-update-side-effects';

interface ResolveApplicantJobMatchInput {
  onError?: (error: unknown) => void;
}

interface AssignApplicantUpdateHeadcountInput {
  actingUserId: string;
  actingUserName: string;
  applicantId: string;
  client: ApplicantDetailUpdateClient;
  nextStatus: unknown;
  positionId?: string | null;
  previousStatus: unknown;
}

interface BroadcastApplicantUpdateHeadcountInput {
  client: ApplicantDetailUpdateClient;
  nextStatus: unknown;
  previousStatus: unknown;
}

interface RunApplicantUpdateTransitionInput {
  actingUserId: string;
  applicantId: string;
  client: ApplicantDetailUpdateClient;
  fallbackPositionId?: string | null;
  newRecruiterId?: unknown;
  newRecruiterName?: string | null;
  oldRecruiterId?: string | null;
  oldRecruiterName?: string | null;
  previousStatus: unknown;
  nextStatus: unknown;
  recruiterChanged: boolean;
  requestedPositionId?: unknown;
  transitionNotes: string | null;
}

export function resolveApplicantJobMatchEnabled({
  onError,
}: ResolveApplicantJobMatchInput = {}) {
  return getApplicantJobMatchFeatureEnabled({
    readSystemSetting: getSystemSetting,
    onError,
  });
}

export function assignApplicantUpdateHeadcount({
  actingUserId,
  actingUserName,
  applicantId,
  client,
  nextStatus,
  positionId,
  previousStatus,
}: AssignApplicantUpdateHeadcountInput) {
  return assignApplicantHeadcountAfterHire({
    client,
    applicantId,
    positionId,
    nextStatus,
    previousStatus,
    actingUserId,
    actingUserName,
    validateHiringStatus: validateApplicantHiringStatus,
    assignToHeadcount: assignApplicantToHeadcount,
    onRaceCondition: (details) => {
      console.warn(`Race condition detected: Headcount became unavailable for Applicant ${applicantId} during assignment. Cannot proceed with status update.`, details);
    },
    onAssignError: (headcountError) => {
      console.error('Error assigning headcount:', headcountError);
    },
    onStageLookupError: (error) => {
      console.error('Error getting stage name for headcount assignment:', error);
    },
  });
}

export function broadcastApplicantUpdateHeadcountChanges({
  client,
  previousStatus,
  nextStatus,
}: BroadcastApplicantUpdateHeadcountInput) {
  return broadcastApplicantPositionHeadcountChanges({
    client,
    previousStatus,
    nextStatus,
    getRecruitmentStageByName,
    broadcastPositionListUpdated,
    broadcastPositionStatisticsUpdated,
    onError: (broadcastError) => {
      console.error('Failed to broadcast real-time updates for headcount changes:', broadcastError);
    },
  });
}

export function runApplicantUpdateTransitionEffects({
  actingUserId,
  applicantId,
  client,
  fallbackPositionId,
  newRecruiterId,
  newRecruiterName,
  oldRecruiterId,
  oldRecruiterName,
  previousStatus,
  nextStatus,
  recruiterChanged,
  requestedPositionId,
  transitionNotes,
}: RunApplicantUpdateTransitionInput) {
  return runApplicantTransitionSideEffects({
    client,
    applicantId,
    requestedPositionId,
    fallbackPositionId,
    previousStatus,
    nextStatus,
    transitionNotes,
    recruiterChanged,
    oldRecruiterId,
    newRecruiterId,
    oldRecruiterName,
    newRecruiterName,
    actingUserId,
    createTransitionId: uuidv4,
    broadcastApplicantUpdate,
    notifyApplicantStatusChange: (
      changedApplicantId,
      applicantName,
      previousStatus,
      nextStatus,
      notificationPositionId,
      positionTitle,
      recruiterId,
      changedByUserId
    ) => NotificationService.notifyApplicantStatusChange(
      changedApplicantId,
      applicantName,
      previousStatus as string,
      nextStatus as string,
      notificationPositionId as string,
      positionTitle,
      recruiterId,
      changedByUserId
    ),
    onMissingPosition: (missingPositionId) => {
      console.warn(`Position ${missingPositionId} not found, setting positionId to null for transition record`);
    },
    onStatusTransitionBroadcastError: (broadcastError) => {
      console.error('Failed to broadcast transition record:', broadcastError);
    },
    onRecruiterTransitionBroadcastError: (broadcastError) => {
      console.error('Failed to broadcast recruiter change transition record:', broadcastError);
    },
    onNotificationError: (notificationError) => {
      console.error('Failed to send Applicant status change notification:', notificationError);
    },
    onStatusTransitionError: (transitionError) => {
      console.error('Error creating transition record:', transitionError);
    },
    onRecruiterTransitionError: (transitionError) => {
      console.error('Error creating recruiter change transition record:', transitionError);
    },
  });
}
