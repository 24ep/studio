import type { QueryResultRow } from 'pg';

interface ApplicantDetailQueryClient {
  query: (query: string, values?: unknown[]) => Promise<{ rows: QueryResultRow[] }>;
}

type RecruiterNameRow = QueryResultRow & {
  name: string | null;
};

type ApplicantTransitionRecordRow = QueryResultRow & {
  id: string;
};

interface RecruiterChangeTransitionMessageInput {
  oldRecruiterId?: string | null;
  newRecruiterId?: string | null;
  oldRecruiterName?: string | null;
  newRecruiterName?: string | null;
}

interface ApplicantRecruiterChangeDetailsInput {
  client: ApplicantDetailQueryClient;
  previousRecruiterId?: string | null;
  nextRecruiterId?: unknown;
}

interface ApplicantTransitionPositionInput {
  client: ApplicantDetailQueryClient;
  requestedPositionId?: unknown;
  fallbackPositionId?: string | null;
  onMissingPosition?: (positionId: string) => void;
}

interface ApplicantTransitionInsertInput {
  client: ApplicantDetailQueryClient;
  transitionId: string;
  applicantId: string;
  positionId: string | null;
  stage: unknown;
  notes: string | null;
  actingUserId: string;
  broadcastTransition?: (payload: Record<string, unknown>, actingUserId: string) => void;
  onBroadcastError?: (error: unknown) => void;
}

export function buildRecruiterChangeTransitionMessage({
  oldRecruiterId,
  newRecruiterId,
  oldRecruiterName,
  newRecruiterName,
}: RecruiterChangeTransitionMessageInput) {
  if (oldRecruiterId && newRecruiterId) {
    return `Recruiter changed from ${oldRecruiterName || oldRecruiterId} to ${newRecruiterName || newRecruiterId}`;
  }

  if (!oldRecruiterId && newRecruiterId) {
    return `Recruiter assigned: ${newRecruiterName || newRecruiterId}`;
  }

  if (oldRecruiterId && !newRecruiterId) {
    return `Recruiter unassigned (was ${oldRecruiterName || oldRecruiterId})`;
  }

  return 'Recruiter assignment changed.';
}

async function fetchRecruiterName(client: ApplicantDetailQueryClient, recruiterId: string) {
  const result = await client.query('SELECT name FROM "User" WHERE id = $1', [recruiterId]);
  const row = result.rows[0] as RecruiterNameRow | undefined;
  return row?.name || null;
}

export async function fetchApplicantRecruiterChangeDetails({
  client,
  previousRecruiterId,
  nextRecruiterId,
}: ApplicantRecruiterChangeDetailsInput) {
  if (nextRecruiterId === undefined || nextRecruiterId === previousRecruiterId) {
    return {
      recruiterChanged: false,
      oldRecruiterName: null,
      newRecruiterName: null,
    };
  }

  const normalizedNextRecruiterId = typeof nextRecruiterId === 'string' ? nextRecruiterId : null;

  return {
    recruiterChanged: true,
    oldRecruiterName: previousRecruiterId
      ? await fetchRecruiterName(client, previousRecruiterId)
      : null,
    newRecruiterName: normalizedNextRecruiterId
      ? await fetchRecruiterName(client, normalizedNextRecruiterId)
      : null,
  };
}

export async function resolveApplicantTransitionPositionId({
  client,
  requestedPositionId,
  fallbackPositionId,
  onMissingPosition,
}: ApplicantTransitionPositionInput) {
  const positionId = typeof requestedPositionId === 'string'
    ? requestedPositionId
    : fallbackPositionId || null;

  if (!positionId) {
    return null;
  }

  const positionCheck = await client.query('SELECT id FROM "Position" WHERE id = $1::uuid', [positionId]);
  if (positionCheck.rows.length === 0) {
    onMissingPosition?.(positionId);
    return null;
  }

  return positionId;
}

export async function insertApplicantTransitionRecord({
  client,
  transitionId,
  applicantId,
  positionId,
  stage,
  notes,
  actingUserId,
  broadcastTransition,
  onBroadcastError,
}: ApplicantTransitionInsertInput) {
  await client.query(`
    INSERT INTO "TransitionRecord" (id, "applicant_id", "positionId", stage, notes, "actingUserId", date, "createdAt", "updatedAt")
    VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW(), NOW());
  `, [
    transitionId,
    applicantId,
    positionId,
    stage,
    notes,
    actingUserId,
  ]);

  const transitionResult = await client.query(
    'SELECT * FROM "TransitionRecord" WHERE id = $1',
    [transitionId]
  );
  const transition = transitionResult.rows[0] as ApplicantTransitionRecordRow | undefined || null;

  if (transition && broadcastTransition) {
    try {
      broadcastTransition({ id: applicantId, transition }, actingUserId);
    } catch (error) {
      onBroadcastError?.(error);
    }
  }

  return transition;
}
