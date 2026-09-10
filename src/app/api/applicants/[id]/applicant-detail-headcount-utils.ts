import type { QueryResultRow } from 'pg';

interface ApplicantDetailQueryClient {
  query: (query: string, values?: unknown[]) => Promise<{ rows: QueryResultRow[] }>;
}

type RecruitmentStageNameRow = QueryResultRow & {
  name: string | null;
};

interface ApplicantHiringValidationResult {
  canHire: boolean;
  message: string;
  reason: string;
  headcountStatus: unknown;
}

type ValidateApplicantHiringStatus = (
  applicantId: string,
  positionId: string
) => Promise<ApplicantHiringValidationResult>;

type AssignApplicantToHeadcount = (
  applicantId: string,
  positionId: string,
  actingUserId: string,
  actingUserName: string
) => Promise<unknown>;

interface ApplicantHeadcountStatusInput {
  client: ApplicantDetailQueryClient;
  applicantId: string;
  positionId?: string | null;
  nextStatus?: unknown;
  previousStatus?: unknown;
  validateHiringStatus: ValidateApplicantHiringStatus;
}

interface ApplicantHeadcountAssignmentInput extends ApplicantHeadcountStatusInput {
  actingUserId: string;
  actingUserName: string;
  assignToHeadcount: AssignApplicantToHeadcount;
  now?: () => Date;
  onRaceCondition?: (details: Record<string, unknown>) => void;
  onAssignError?: (error: unknown) => void;
  onStageLookupError?: (error: unknown) => void;
}

export type ApplicantHeadcountGuardResult =
  | { ok: true }
  | { ok: false; status: number; body: Record<string, unknown>; error?: unknown };

export type ApplicantHeadcountAssignmentResult =
  | { ok: true; headcountAssignment: unknown | null }
  | { ok: false; status: number; body: Record<string, unknown> };

function isStatusChangingToKnownStage(nextStatus: unknown, previousStatus: unknown, positionId?: string | null) {
  return nextStatus !== undefined && nextStatus !== previousStatus && Boolean(positionId);
}

async function getRecruitmentStageName(client: ApplicantDetailQueryClient, status: unknown) {
  const stageResult = await client.query('SELECT name FROM "RecruitmentStage" WHERE id = $1::uuid', [status]);
  const row = stageResult.rows[0] as RecruitmentStageNameRow | undefined;
  return row?.name || null;
}

export async function validateApplicantHeadcountForHire({
  client,
  applicantId,
  positionId,
  nextStatus,
  previousStatus,
  validateHiringStatus,
}: ApplicantHeadcountStatusInput): Promise<ApplicantHeadcountGuardResult> {
  if (!isStatusChangingToKnownStage(nextStatus, previousStatus, positionId)) {
    return { ok: true };
  }

  try {
    const stageName = await getRecruitmentStageName(client, nextStatus);
    if (stageName !== 'Hired') {
      return { ok: true };
    }

    try {
      const validation = await validateHiringStatus(applicantId, positionId as string);
      if (!validation.canHire) {
        return {
          ok: false,
          status: 400,
          body: {
            message: validation.message,
            reason: validation.reason,
            headcountStatus: validation.headcountStatus,
          },
        };
      }
    } catch (error) {
      return {
        ok: false,
        status: 500,
        error,
        body: {
          message: error instanceof Error ? error.message : 'Error validating headcount availability',
          reason: 'VALIDATION_ERROR',
          headcountStatus: null,
        },
      };
    }

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      status: 500,
      error,
      body: { message: 'Error validating status for headcount assignment' },
    };
  }
}

export async function assignApplicantHeadcountAfterHire({
  client,
  applicantId,
  positionId,
  nextStatus,
  previousStatus,
  actingUserId,
  actingUserName,
  validateHiringStatus,
  assignToHeadcount,
  now = () => new Date(),
  onRaceCondition,
  onAssignError,
  onStageLookupError,
}: ApplicantHeadcountAssignmentInput): Promise<ApplicantHeadcountAssignmentResult> {
  if (!isStatusChangingToKnownStage(nextStatus, previousStatus, positionId)) {
    return { ok: true, headcountAssignment: null };
  }

  try {
    const stageName = await getRecruitmentStageName(client, nextStatus);
    if (stageName !== 'Hired') {
      return { ok: true, headcountAssignment: null };
    }

    try {
      const validation = await validateHiringStatus(applicantId, positionId as string);
      if (validation.canHire && validation.reason === 'VACANT_HEADCOUNT_AVAILABLE') {
        const revalidation = await validateHiringStatus(applicantId, positionId as string);

        if (!revalidation.canHire) {
          onRaceCondition?.({
            applicantId,
            positionId,
            originalValidation: validation,
            revalidation,
            timestamp: now().toISOString(),
          });

          return {
            ok: false,
            status: 400,
            body: {
              message: `Headcount became unavailable: ${revalidation.message}`,
              reason: revalidation.reason,
              headcountStatus: revalidation.headcountStatus,
            },
          };
        }

        return {
          ok: true,
          headcountAssignment: await assignToHeadcount(
            applicantId,
            positionId as string,
            actingUserId,
            actingUserName
          ),
        };
      }
    } catch (error) {
      onAssignError?.(error);
    }
  } catch (error) {
    onStageLookupError?.(error);
  }

  return { ok: true, headcountAssignment: null };
}
