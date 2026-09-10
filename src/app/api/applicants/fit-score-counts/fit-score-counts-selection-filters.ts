import {
  appendCondition,
  isUuid,
  splitFilterValues,
  type FilterState,
  type QueryClient,
} from './fit-score-counts-filter-state';
import { appendNullableSelectionFilter } from './fit-score-counts-nullable-selection-filter';

function appendPositionFilter(state: FilterState, searchParams: URLSearchParams) {
  const positionIds = splitFilterValues(searchParams.get('positionId'));
  if (positionIds.length === 0) {
    return;
  }

  const placeholders = positionIds.map((_, index) => `$${state.paramIndex + index}`);
  appendCondition(
    state,
    `c."positionId" IN (${placeholders.join(', ')})`,
    positionIds,
    state.paramIndex + positionIds.length
  );
}

async function fetchStatusIds(client: QueryClient, names: string[]) {
  if (names.length === 0) {
    return [];
  }

  const result = await client.query(
    'SELECT id FROM "RecruitmentStage" WHERE name = ANY($1::text[])',
    [names]
  );
  return result.rows.map(row => row.id as string);
}

function appendStatusIdFilter(state: FilterState, statusIds: string[]) {
  if (statusIds.length === 1) {
    appendCondition(state, `c."statusId" = $${state.paramIndex++}`, [statusIds[0]]);
  } else if (statusIds.length > 1) {
    appendCondition(state, `c."statusId" = ANY($${state.paramIndex++}::uuid[])`, [statusIds]);
  }
}

async function appendStatusFilter(state: FilterState, client: QueryClient, searchParams: URLSearchParams) {
  const statuses = splitFilterValues(searchParams.get('status'));
  if (statuses.length === 0) {
    return;
  }

  const uuidStatuses = statuses.filter(isUuid);
  const nameStatuses = statuses.filter(status => !isUuid(status));
  const statusIds = [
    ...uuidStatuses,
    ...await fetchStatusIds(client, nameStatuses),
  ];

  appendStatusIdFilter(state, statusIds);
}

function appendRecruiterFilter(state: FilterState, searchParams: URLSearchParams) {
  const recruiterIds = splitFilterValues(searchParams.get('recruiterId'));
  appendNullableSelectionFilter(state, recruiterIds, {
    nullCondition: `c."recruiterId" IS NULL`,
    singleCondition: placeholder => `c."recruiterId" = ${placeholder}`,
    arrayCondition: placeholder => `c."recruiterId" = ANY(${placeholder}::uuid[])`,
    nullOrArrayCondition: placeholder => (
      `(c."recruiterId" IS NULL OR c."recruiterId" = ANY(${placeholder}::uuid[]))`
    ),
  });
}

function appendSourceFilter(state: FilterState, searchParams: URLSearchParams) {
  const sourceIds = splitFilterValues(searchParams.get('sourceId'));
  appendNullableSelectionFilter(state, sourceIds, {
    nullCondition: `c."sourceId" IS NULL`,
    singleCondition: placeholder => `c."sourceId" = ${placeholder}`,
    arrayCondition: placeholder => `c."sourceId" = ANY(${placeholder}::uuid[])`,
    nullOrSingleCondition: placeholder => `(c."sourceId" = ${placeholder} OR c."sourceId" IS NULL)`,
    nullOrArrayCondition: placeholder => (
      `(c."sourceId" = ANY(${placeholder}::uuid[]) OR c."sourceId" IS NULL)`
    ),
  });
}

export async function appendFitScoreSelectionFilters(
  state: FilterState,
  client: QueryClient,
  searchParams: URLSearchParams
) {
  appendPositionFilter(state, searchParams);
  await appendStatusFilter(state, client, searchParams);
  appendRecruiterFilter(state, searchParams);
  appendSourceFilter(state, searchParams);
}
