import {
  buildRecruiterChangeTransitionMessage,
} from './applicant-detail-transition-utils';
import type { QueryResultRow } from 'pg';
import {
  insertSafeTransitionRecord,
  notifyRecruiterAboutStatusChange,
  type ApplicantDetailQueryClient,
  type BroadcastApplicantTransition,
  type NotifyApplicantStatusChange,
} from './applicant-detail-transition-side-effect-helpers';

type PositionStatsRow = QueryResultRow & {
  total: string | number;
  open: string | number;
  closed: string | number;
};

interface ApplicantPositionHeadcountBroadcastInput {
  client: ApplicantDetailQueryClient;
  previousStatus: unknown;
  nextStatus: unknown;
  getRecruitmentStageByName: (stageName: string) => Promise<string | null | undefined>;
  broadcastPositionListUpdated: () => void;
  broadcastPositionStatisticsUpdated: (statistics: { total: number; open: number; closed: number }) => void;
  onError?: (error: unknown) => void;
}

interface ApplicantTransitionSideEffectsInput {
  client: ApplicantDetailQueryClient;
  applicantId: string;
  requestedPositionId?: unknown;
  fallbackPositionId?: string | null;
  previousStatus: unknown;
  nextStatus: unknown;
  transitionNotes?: string | null;
  recruiterChanged: boolean;
  oldRecruiterId?: string | null;
  newRecruiterId?: unknown;
  oldRecruiterName?: string | null;
  newRecruiterName?: string | null;
  actingUserId: string;
  createTransitionId: () => string;
  broadcastApplicantUpdate: BroadcastApplicantTransition;
  notifyApplicantStatusChange: NotifyApplicantStatusChange;
  onMissingPosition?: (positionId: string) => void;
  onStatusTransitionBroadcastError?: (error: unknown) => void;
  onRecruiterTransitionBroadcastError?: (error: unknown) => void;
  onNotificationError?: (error: unknown) => void;
  onStatusTransitionError?: (error: unknown) => void;
  onRecruiterTransitionError?: (error: unknown) => void;
}

export async function broadcastApplicantPositionHeadcountChanges({
  client,
  previousStatus,
  nextStatus,
  getRecruitmentStageByName,
  broadcastPositionListUpdated,
  broadcastPositionStatisticsUpdated,
  onError,
}: ApplicantPositionHeadcountBroadcastInput) {
  if (nextStatus === undefined || previousStatus === nextStatus) {
    return;
  }

  try {
    const hiredStageId = await getRecruitmentStageByName('Hired');
    if (!hiredStageId || (nextStatus !== hiredStageId && previousStatus !== hiredStageId)) {
      return;
    }

    broadcastPositionListUpdated();

    const statsResult = await client.query(`
      SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN "isOpen" = TRUE THEN 1 END) as open,
        COUNT(CASE WHEN "isOpen" = FALSE THEN 1 END) as closed
      FROM "Position"
    `);
    const stats = statsResult.rows[0] as PositionStatsRow;
    broadcastPositionStatisticsUpdated({
      total: parseInt(String(stats.total), 10),
      open: parseInt(String(stats.open), 10),
      closed: parseInt(String(stats.closed), 10),
    });
  } catch (error) {
    onError?.(error);
  }
}

export async function runApplicantTransitionSideEffects({
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
  createTransitionId,
  broadcastApplicantUpdate,
  notifyApplicantStatusChange,
  onMissingPosition,
  onStatusTransitionBroadcastError,
  onRecruiterTransitionBroadcastError,
  onNotificationError,
  onStatusTransitionError,
  onRecruiterTransitionError,
}: ApplicantTransitionSideEffectsInput) {
  if (nextStatus !== undefined && previousStatus !== nextStatus) {
    try {
      await insertSafeTransitionRecord({
        client,
        applicantId,
        requestedPositionId,
        fallbackPositionId,
        actingUserId,
        createTransitionId,
        broadcastApplicantUpdate,
        onMissingPosition,
        stage: nextStatus,
        notes: transitionNotes || null,
        onBroadcastError: onStatusTransitionBroadcastError,
      });

      await notifyRecruiterAboutStatusChange({
        client,
        applicantId,
        previousStatus,
        nextStatus,
        actingUserId,
        notifyApplicantStatusChange,
        onNotificationError,
      });
    } catch (error) {
      onStatusTransitionError?.(error);
      throw error;
    }

    return;
  }

  if (!recruiterChanged) {
    return;
  }

  try {
    const transitionMessage = buildRecruiterChangeTransitionMessage({
      oldRecruiterId,
      newRecruiterId: typeof newRecruiterId === 'string' ? newRecruiterId : null,
      oldRecruiterName,
      newRecruiterName,
    });

    await insertSafeTransitionRecord({
      client,
      applicantId,
      requestedPositionId,
      fallbackPositionId,
      actingUserId,
      createTransitionId,
      broadcastApplicantUpdate,
      onMissingPosition,
      stage: 'Applied',
      notes: transitionMessage,
      onBroadcastError: onRecruiterTransitionBroadcastError,
    });
  } catch (error) {
    onRecruiterTransitionError?.(error);
    throw error;
  }
}
