import {
  appendHiringManagerFilter,
  appendRecruiterViewFilter,
} from './taskboard-applicants-access-filters';
import type {
  DbClient,
  TaskboardApplicantFilters,
  TaskboardQueryParts,
  TaskboardSession,
} from './taskboard-applicants-types';
import {
  appendApplicationDateFilters,
  appendAssignmentStatusFilter,
  appendFitScoreFilters,
  appendNameFilter,
  appendPositionFilter,
  appendPositionStatusFilter,
  appendRecruiterFilter,
  appendScoreStatusFilter,
  appendStatusFilter,
} from './taskboard-applicants-value-filters';

export async function buildTaskboardApplicantWhereClause(
  client: DbClient,
  filters: TaskboardApplicantFilters,
  session: TaskboardSession,
) {
  const parts: TaskboardQueryParts = {
    whereClauses: [],
    queryParams: [],
    paramIndex: 1,
  };

  appendNameFilter(parts, filters.name);
  await appendStatusFilter(client, parts, filters.status);
  appendPositionFilter(parts, filters.positionId);
  appendRecruiterFilter(parts, filters.recruiterId);
  appendFitScoreFilters(parts, filters);
  appendApplicationDateFilters(parts, filters);
  appendAssignmentStatusFilter(parts, filters.assignmentStatus);
  appendPositionStatusFilter(parts, filters.positionStatus);
  appendScoreStatusFilter(parts, filters.scoreStatus);
  appendRecruiterViewFilter(parts, filters, session);
  await appendHiringManagerFilter(parts, session);

  return {
    whereClause: parts.whereClauses.length > 0 ? `WHERE ${parts.whereClauses.join(' AND ')}` : '',
    queryParams: parts.queryParams,
    nextParamIndex: parts.paramIndex,
  };
}
