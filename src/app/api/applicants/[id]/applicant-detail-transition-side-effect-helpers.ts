import type { QueryResultRow } from 'pg';
import {
  insertApplicantTransitionRecord,
  resolveApplicantTransitionPositionId,
} from './applicant-detail-transition-utils';

export interface ApplicantDetailQueryClient {
  query: (query: string, values?: unknown[]) => Promise<{ rows: QueryResultRow[] }>;
}

export type BroadcastApplicantTransition = (payload: Record<string, unknown>, actingUserId: string) => void;

export type NotifyApplicantStatusChange = (
  applicantId: string,
  applicantName: string,
  previousStatus: unknown,
  nextStatus: unknown,
  positionId: string | null | undefined,
  positionTitle: string,
  recruiterId: string,
  actingUserId: string
) => Promise<unknown>;

type ApplicantNotificationContextRow = QueryResultRow & {
  name: string;
  positionId: string | null;
  positionTitle: string | null;
  recruiterId: string | null;
  recruiterName: string | null;
};

interface SafeTransitionRecordInput {
  client: ApplicantDetailQueryClient;
  applicantId: string;
  requestedPositionId?: unknown;
  fallbackPositionId?: string | null;
  actingUserId: string;
  createTransitionId: () => string;
  broadcastApplicantUpdate: BroadcastApplicantTransition;
  onMissingPosition?: (positionId: string) => void;
  stage: unknown;
  notes: string | null;
  onBroadcastError?: (error: unknown) => void;
}

interface StatusChangeNotificationInput {
  client: ApplicantDetailQueryClient;
  applicantId: string;
  previousStatus: unknown;
  nextStatus: unknown;
  actingUserId: string;
  notifyApplicantStatusChange: NotifyApplicantStatusChange;
  onNotificationError?: (error: unknown) => void;
}

async function fetchApplicantStatusNotificationContext(
  client: ApplicantDetailQueryClient,
  applicantId: string
) {
  const applicantWithRecruiterQuery = `
    SELECT c.*, p.title as "positionTitle", u.id as "recruiterId", u.name as "recruiterName"
    FROM "Applicant" c
    LEFT JOIN "Position" p ON c."positionId" = p.id
    LEFT JOIN "User" u ON c."recruiterId" = u.id
    WHERE c.id = $1
  `;
  const applicantWithRecruiterResult = await client.query(applicantWithRecruiterQuery, [applicantId]);
  return applicantWithRecruiterResult.rows[0] as ApplicantNotificationContextRow | undefined || null;
}

export async function insertSafeTransitionRecord({
  client,
  applicantId,
  requestedPositionId,
  fallbackPositionId,
  actingUserId,
  createTransitionId,
  broadcastApplicantUpdate,
  onMissingPosition,
  stage,
  notes,
  onBroadcastError,
}: SafeTransitionRecordInput) {
  const safePositionId = await resolveApplicantTransitionPositionId({
    client,
    requestedPositionId,
    fallbackPositionId,
    onMissingPosition,
  });

  await insertApplicantTransitionRecord({
    client,
    transitionId: createTransitionId(),
    applicantId,
    positionId: safePositionId,
    stage,
    notes,
    actingUserId,
    broadcastTransition: broadcastApplicantUpdate,
    onBroadcastError,
  });
}

export async function notifyRecruiterAboutStatusChange({
  client,
  applicantId,
  previousStatus,
  nextStatus,
  actingUserId,
  notifyApplicantStatusChange,
  onNotificationError,
}: StatusChangeNotificationInput) {
  const applicantWithRecruiter = await fetchApplicantStatusNotificationContext(client, applicantId);
  if (!applicantWithRecruiter?.recruiterId || nextStatus === null) {
    return;
  }

  try {
    await notifyApplicantStatusChange(
      applicantId,
      applicantWithRecruiter.name,
      previousStatus,
      nextStatus,
      applicantWithRecruiter.positionId,
      applicantWithRecruiter.positionTitle || 'Unknown Position',
      applicantWithRecruiter.recruiterId,
      actingUserId
    );
  } catch (error) {
    onNotificationError?.(error);
  }
}
