import type {
  DbClient,
  TaskboardApplicantFilters,
  TaskboardQueryParts,
} from './taskboard-applicants-types';
import {
  splitTaskboardFilterList,
  TASKBOARD_UUID_PATTERN,
} from './taskboard-applicants-filter-utils';
import {
  appendTaskboardCondition,
  appendTaskboardMappedStatusFilter,
  appendTaskboardNullableSelectionFilter,
  appendTaskboardSingleOrArrayFilter,
  getTaskboardPlaceholder,
} from './taskboard-applicants-query-utils';

const ASSIGNMENT_STATUS_CONDITIONS: Record<string, string> = {
  assigned: `c."recruiterId" IS NOT NULL`,
  unassigned: `c."recruiterId" IS NULL`,
};

const POSITION_STATUS_CONDITIONS: Record<string, string> = {
  'with-position': `c."positionId" IS NOT NULL`,
  'without-position': `c."positionId" IS NULL`,
};

const SCORE_STATUS_CONDITIONS: Record<string, string> = {
  scored: `COALESCE(c."fitScore", 0) > 0`,
  unscored: `COALESCE(c."fitScore", 0) = 0`,
};

export function appendNameFilter(parts: TaskboardQueryParts, name: string | null) {
  if (!name) return;

  appendTaskboardCondition(parts, `c.name ILIKE ${getTaskboardPlaceholder(parts)}`, [`%${name}%`]);
}

export async function appendStatusFilter(
  client: DbClient,
  parts: TaskboardQueryParts,
  status: string | null,
) {
  const statuses = splitTaskboardFilterList(status);
  if (statuses.length === 0) return;

  const uuidStatuses = statuses.filter((candidate) => TASKBOARD_UUID_PATTERN.test(candidate));
  const nameStatuses = statuses.filter((candidate) => !TASKBOARD_UUID_PATTERN.test(candidate));
  const statusIds = [...uuidStatuses];

  if (nameStatuses.length > 0) {
    const result = await client.query<{ id: string }>(
      'SELECT id FROM "RecruitmentStage" WHERE name = ANY($1::text[])',
      [nameStatuses],
    );
    statusIds.push(...result.rows.map((row) => row.id));
  }

  if (statusIds.length > 0) {
    appendTaskboardCondition(parts, `c."statusId" = ANY(${getTaskboardPlaceholder(parts)}::uuid[])`, [statusIds]);
  }
}

export function appendPositionFilter(parts: TaskboardQueryParts, positionId: string | null) {
  const positionIds = splitTaskboardFilterList(positionId);
  appendTaskboardSingleOrArrayFilter(parts, `c."positionId"`, positionIds);
}

export function appendRecruiterFilter(parts: TaskboardQueryParts, recruiterId: string | null) {
  const recruiterIds = splitTaskboardFilterList(recruiterId);
  appendTaskboardNullableSelectionFilter(parts, recruiterIds, {
    nullCondition: `c."recruiterId" IS NULL`,
    arrayCondition: (placeholder) => `c."recruiterId" = ANY(${placeholder}::uuid[])`,
    nullOrArrayCondition: (placeholder) => `(c."recruiterId" IS NULL OR c."recruiterId" = ANY(${placeholder}::uuid[]))`,
  });
}

export function appendFitScoreFilters(parts: TaskboardQueryParts, filters: TaskboardApplicantFilters) {
  if (filters.minFitScore) {
    appendTaskboardCondition(parts, `c."fitScore" >= ${getTaskboardPlaceholder(parts)}`, [Number(filters.minFitScore)]);
  }

  if (filters.maxFitScore) {
    appendTaskboardCondition(parts, `c."fitScore" <= ${getTaskboardPlaceholder(parts)}`, [Number(filters.maxFitScore)]);
  }
}

export function appendApplicationDateFilters(
  parts: TaskboardQueryParts,
  filters: TaskboardApplicantFilters,
) {
  if (filters.applicationDateStart) {
    appendTaskboardCondition(
      parts,
      `c."applicationDate" >= ${getTaskboardPlaceholder(parts)}`,
      [new Date(filters.applicationDateStart)],
    );
  }

  if (filters.applicationDateEnd) {
    const endDate = new Date(filters.applicationDateEnd);
    endDate.setHours(23, 59, 59, 999);
    appendTaskboardCondition(parts, `c."applicationDate" <= ${getTaskboardPlaceholder(parts)}`, [endDate]);
  }
}

export function appendAssignmentStatusFilter(parts: TaskboardQueryParts, assignmentStatus: string | null) {
  appendTaskboardMappedStatusFilter(parts, assignmentStatus, ASSIGNMENT_STATUS_CONDITIONS);
}

export function appendPositionStatusFilter(parts: TaskboardQueryParts, positionStatus: string | null) {
  appendTaskboardMappedStatusFilter(parts, positionStatus, POSITION_STATUS_CONDITIONS);
}

export function appendScoreStatusFilter(parts: TaskboardQueryParts, scoreStatus: string | null) {
  appendTaskboardMappedStatusFilter(parts, scoreStatus, SCORE_STATUS_CONDITIONS);
}
