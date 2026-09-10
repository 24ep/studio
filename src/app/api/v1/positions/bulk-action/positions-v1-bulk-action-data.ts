import type { QueryResultRow } from 'pg';
import type { DbClient } from '@/lib/db';
import type { V1PositionBulkActionInput } from './positions-v1-bulk-action-schema';

type CountRow = QueryResultRow & {
  count: string;
};

export interface V1PositionBulkActionQuery {
  query: string;
  params: unknown[];
}

export async function buildV1PositionBulkActionQuery(
  client: DbClient,
  input: V1PositionBulkActionInput
): Promise<
  | { ok: true; actionQuery: V1PositionBulkActionQuery }
  | { ok: false; status: number; error: string; auditLevel: 'WARN' | 'ERROR'; auditMessage: string; auditDetails: Record<string, unknown> }
> {
  switch (input.action) {
    case 'delete':
      return buildDeletePositionsQuery(client, input.positionIds);
    case 'update_status':
      return buildUpdateStatusQuery(input);
    case 'update_department':
      return buildUpdateDepartmentQuery(input);
    case 'update_match_criteria':
      return buildUpdateMatchCriteriaQuery(input);
  }
}

async function buildDeletePositionsQuery(client: DbClient, positionIds: string[]) {
  const applicantsResult = await client.query<CountRow>(
    'SELECT COUNT(*) FROM "Applicant" WHERE "positionId" = ANY($1::uuid[])',
    [positionIds]
  );
  const applicantCount = parseInt(applicantsResult.rows[0].count, 10);

  if (applicantCount > 0) {
    return {
      ok: false as const,
      status: 400,
      error: `Cannot delete positions with assigned Applicants. Found ${applicantCount} Applicants assigned to these positions.`,
      auditLevel: 'WARN' as const,
      auditMessage: 'Bulk delete attempt for positions with assigned Applicants',
      auditDetails: { positionIds, applicantCount },
    };
  }

  return {
    ok: true as const,
    actionQuery: {
      query: 'DELETE FROM "Position" WHERE id = ANY($1::uuid[])',
      params: [positionIds],
    },
  };
}

function buildUpdateStatusQuery(input: V1PositionBulkActionInput) {
  if (input.data?.isOpen === undefined) {
    return missingActionData(input, 'isOpen status is required for update_status action', 'Bulk update_status failed (missing isOpen)');
  }

  return {
    ok: true as const,
    actionQuery: {
      query: 'UPDATE "Position" SET "isOpen" = $1 WHERE id = ANY($2::uuid[])',
      params: [input.data.isOpen, input.positionIds],
    },
  };
}

function buildUpdateDepartmentQuery(input: V1PositionBulkActionInput) {
  if (!input.data?.department) {
    return missingActionData(input, 'Department is required for update_department action', 'Bulk update_department failed (missing department)');
  }

  return {
    ok: true as const,
    actionQuery: {
      query: 'UPDATE "Position" SET department = $1 WHERE id = ANY($2::uuid[])',
      params: [input.data.department, input.positionIds],
    },
  };
}

function buildUpdateMatchCriteriaQuery(input: V1PositionBulkActionInput) {
  if (input.data?.matchCriteria === undefined) {
    return missingActionData(input, 'Match criteria is required for update_match_criteria action', 'Bulk update_match_criteria failed (missing matchCriteria)');
  }

  return {
    ok: true as const,
    actionQuery: {
      query: 'UPDATE "Position" SET "matchCriteria" = $1 WHERE id = ANY($2::uuid[])',
      params: [input.data.matchCriteria, input.positionIds],
    },
  };
}

function missingActionData(
  input: V1PositionBulkActionInput,
  error: string,
  auditMessage: string
) {
  return {
    ok: false as const,
    status: 400,
    error,
    auditLevel: 'ERROR' as const,
    auditMessage,
    auditDetails: { positionIds: input.positionIds },
  };
}
