import type { QueryResultRow } from 'pg';
import { appendCondition } from './applicants-route-list-where-state';
import type { ApplicantRouteListQueryClient, ApplicantRouteWhereState } from './applicants-route-list-where-types';

type RecruitmentStageIdRow = QueryResultRow & {
  id: string;
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function appendStatusFilter(
  state: ApplicantRouteWhereState,
  client: ApplicantRouteListQueryClient,
  statusFilter?: string
) {
  if (!statusFilter) {
    return;
  }

  const statuses = statusFilter.split(',').map(status => status.trim()).filter(Boolean);
  const hasNullStatus = statuses.includes('null');
  const regularStatuses = statuses.filter(status => status !== 'null');

  if (regularStatuses.length === 0) {
    if (hasNullStatus) {
      state.whereClauses.push(`c."statusId" IS NULL`);
    }
    return;
  }

  const uuidStatuses = regularStatuses.filter(isUUID);
  const nameStatuses = regularStatuses.filter(status => !isUUID(status));
  const statusIds = [
    ...uuidStatuses,
    ...await fetchRecruitmentStageIds(client, nameStatuses),
  ];

  appendStatusIdFilter(state, statusIds, { includeNull: hasNullStatus });
}

function appendStatusIdFilter(
  state: ApplicantRouteWhereState,
  statusIds: string[],
  { includeNull = false }: { includeNull?: boolean } = {}
) {
  if (statusIds.length === 0) {
    if (includeNull) {
      state.whereClauses.push(`c."statusId" IS NULL`);
    }
    return;
  }

  if (includeNull) {
    const statusConditions = statusIds.map((_, index) =>
      `c."statusId" = $${state.paramIndex + index}`
    ).join(' OR ');
    appendCondition(
      state,
      `(${statusConditions} OR c."statusId" IS NULL)`,
      statusIds,
      state.paramIndex + statusIds.length
    );
    return;
  }

  if (statusIds.length === 1) {
    appendCondition(state, `c."statusId" = $${state.paramIndex++}`, [statusIds[0]]);
    return;
  }

  appendCondition(state, `c."statusId" = ANY($${state.paramIndex++}::uuid[])`, [statusIds]);
}

async function fetchRecruitmentStageIds(
  client: ApplicantRouteListQueryClient,
  names: string[]
) {
  if (names.length === 0) {
    return [];
  }

  const result = await client.query(
    'SELECT id FROM "RecruitmentStage" WHERE name = ANY($1::text[])',
    [names]
  );
  return result.rows.map((row) => (row as RecruitmentStageIdRow).id);
}

function isUUID(value: string) {
  return UUID_PATTERN.test(value);
}
