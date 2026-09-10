import { getPool } from '@/lib/db';
import {
  positionIdsSchema,
  type BulkPositionActionInput,
  type PositionBulkActionResult,
} from './position-bulk-action-schema';

type DbQueryResult<Row> = {
  rows: Row[];
  rowCount?: number | null;
};

export type DbClient = {
  query: <Row = unknown>(query: string, values?: unknown[]) => Promise<DbQueryResult<Row>>;
  release: () => void;
};

type PositionIdRow = {
  id: string;
};

type ApplicantPositionRow = {
  positionId: string;
};

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown database connection error';
}

export async function connectPositionBulkActionClient() {
  try {
    return {
      ok: true as const,
      client: await getPool().connect() as DbClient,
    };
  } catch (connectionError) {
    console.error('[Position Bulk Action API] Failed to connect to database:', connectionError);
    return {
      ok: false as const,
      responseBody: {
        message: 'Database connection error',
        error: getErrorMessage(connectionError),
      },
    };
  }
}

export async function runPositionBulkAction(client: DbClient, input: BulkPositionActionInput): Promise<PositionBulkActionResult> {
  if (input.action === 'delete') {
    return deletePositions(client, input.positionIds);
  }

  if (input.action === 'change_status') {
    return updatePositionStatus(client, input.positionIds, input.newIsOpenStatus);
  }

  return updatePositionMatchCriteria(client, input.positionIds, input.matchCriteria);
}

async function deletePositions(client: DbClient, positionIds: string[]): Promise<PositionBulkActionResult> {
  const applicantCheckResult = await client.query<ApplicantPositionRow>(
    'SELECT DISTINCT "positionId" FROM "Applicant" WHERE "positionId" = ANY($1::uuid[])',
    [positionIds]
  );
  const positionsWithApplicants = new Set(applicantCheckResult.rows.map((row) => row.positionId));
  const positionsToDelete = positionIds.filter(id => !positionsWithApplicants.has(id));
  const failedDetails = positionIds
    .filter(id => positionsWithApplicants.has(id))
    .map(positionId => ({
      positionId,
      reason: 'Position has associated Applicants and cannot be deleted.',
    }));

  let successCount = 0;
  if (positionsToDelete.length > 0) {
    validatePositionIds(positionsToDelete, 'Invalid positionsToDelete array: must be array of UUID strings');
    const deleteResult = await client.query<PositionIdRow>(
      'DELETE FROM "Position" WHERE id = ANY($1::uuid[]) RETURNING id',
      [positionsToDelete]
    );
    successCount = deleteResult.rowCount ?? 0;
  }

  return {
    successCount,
    failCount: failedDetails.length,
    failedDetails,
    cacheInvalidated: successCount > 0,
  };
}

async function updatePositionStatus(
  client: DbClient,
  positionIds: string[],
  newIsOpenStatus: boolean | undefined
): Promise<PositionBulkActionResult> {
  if (newIsOpenStatus === undefined) {
    return missingActionInput("New 'isOpen' status is required for 'change_status' action.");
  }

  validatePositionIds(positionIds, 'Invalid positionIds array: must be array of UUID strings');
  const updateResult = await client.query<PositionIdRow>(
    'UPDATE "Position" SET "isOpen" = $1, "updatedAt" = NOW() WHERE id = ANY($2::uuid[]) RETURNING id',
    [newIsOpenStatus, positionIds]
  );

  return buildUpdateResult(positionIds, updateResult);
}

async function updatePositionMatchCriteria(
  client: DbClient,
  positionIds: string[],
  matchCriteria: string | undefined
): Promise<PositionBulkActionResult> {
  if (matchCriteria === undefined) {
    return missingActionInput("Match criteria is required for 'update_match_criteria' action.");
  }

  validatePositionIds(positionIds, 'Invalid positionIds array: must be array of UUID strings');
  const updateResult = await client.query<PositionIdRow>(
    'UPDATE "Position" SET "matchCriteria" = $1, "updatedAt" = NOW() WHERE id = ANY($2::uuid[]) RETURNING id',
    [matchCriteria, positionIds]
  );

  return buildUpdateResult(positionIds, updateResult);
}

function buildUpdateResult(
  positionIds: string[],
  updateResult: DbQueryResult<PositionIdRow>
): PositionBulkActionResult {
  const successCount = updateResult.rowCount ?? 0;
  const updatedIds = new Set(updateResult.rows.map((row) => row.id));
  const failedDetails = positionIds
    .filter(id => !updatedIds.has(id))
    .map(positionId => ({
      positionId,
      reason: 'Position not found or failed to update.',
    }));

  return {
    successCount,
    failCount: positionIds.length - successCount,
    failedDetails,
    cacheInvalidated: successCount > 0,
  };
}

function validatePositionIds(positionIds: string[], errorMessage: string) {
  if (!positionIdsSchema.safeParse(positionIds).success) {
    throw new Error(errorMessage);
  }
}

function missingActionInput(message: string): never {
  const error = new Error(message);
  error.name = 'MissingPositionBulkActionInput';
  throw error;
}
