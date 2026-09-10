import type { Session } from 'next-auth';

import { hasPermission } from '@/lib/permissions';
import { getSystemSetting } from '@/lib/systemSettings';
import { addPositionCustomFieldFilters } from './positions-route-custom-field-filters';
import type {
  PositionFilterConditions,
  PositionListFilters,
} from './positions-route-list-types';

export function parsePositionFilters(searchParams: URLSearchParams): PositionListFilters {
  const customFieldFilters: Record<string, string> = {};
  for (const [key, value] of searchParams.entries()) {
    if (key.startsWith('customField_')) {
      customFieldFilters[key.replace('customField_', '')] = value;
    }
  }

  return {
    title: searchParams.get('title'),
    department: searchParams.get('department'),
    isOpen: searchParams.get('isOpen'),
    positionLevel: searchParams.get('positionLevel'),
    gradeId: searchParams.get('gradeId'),
    recruiterId: searchParams.get('recruiterId'),
    hiringManagerId: searchParams.get('hiringManagerId'),
    limit: parseInt(searchParams.get('limit') || '20', 10),
    offset: parseInt(searchParams.get('offset') || '0', 10),
    includeStats: searchParams.get('includeStats') === 'true',
    includeapplicantStats: searchParams.get('includeapplicantStats') === 'true',
    includeHeadcount: searchParams.get('includeHeadcount') === 'true',
    customFieldFilters,
  };
}

export async function buildPositionFilterConditions(
  filters: PositionListFilters,
  session: Session,
): Promise<PositionFilterConditions> {
  const queryState = createEmptyQueryState();
  addBasicPositionFilters(filters, queryState);
  addRecruiterFilter(filters, queryState);
  addHiringManagerFilter(filters, queryState);

  queryState.paramIndex = await addPositionCustomFieldFilters(
    filters.customFieldFilters,
    queryState.conditions,
    queryState.queryParams,
    queryState.paramIndex,
  );

  await addAssignedHiringManagerFilter(session, queryState);
  return queryState;
}

function createEmptyQueryState(): PositionFilterConditions {
  return {
    conditions: [],
    queryParams: [],
    paramIndex: 1,
    hiringManagerJoinClause: '',
    interviewerJoinClause: '',
  };
}

function addBasicPositionFilters(filters: PositionListFilters, queryState: PositionFilterConditions) {
  if (filters.title) {
    queryState.conditions.push(`p.title ILIKE $${queryState.paramIndex++}`);
    queryState.queryParams.push(`%${filters.title}%`);
  }

  if (filters.department) {
    queryState.conditions.push(`p.department = ANY($${queryState.paramIndex++}::text[])`);
    queryState.queryParams.push(filters.department.split(',').map((department) => department.trim()));
  }

  if (filters.isOpen === 'true') {
    queryState.conditions.push('p."isOpen" = TRUE');
  } else if (filters.isOpen === 'false') {
    queryState.conditions.push('p."isOpen" = FALSE');
  }

  if (filters.positionLevel) {
    queryState.conditions.push(`p."positionLevel" ILIKE $${queryState.paramIndex++}`);
    queryState.queryParams.push(`%${filters.positionLevel}%`);
  }

  if (filters.gradeId) {
    queryState.conditions.push(`p."gradeId" = $${queryState.paramIndex++}`);
    queryState.queryParams.push(filters.gradeId);
  }
}

function addRecruiterFilter(filters: PositionListFilters, queryState: PositionFilterConditions) {
  if (!filters.recruiterId) {
    return;
  }

  if (filters.recruiterId === 'null' || filters.recruiterId === 'unassigned') {
    queryState.conditions.push('p."recruiterId" IS NULL');
    return;
  }

  queryState.conditions.push(`p."recruiterId" = $${queryState.paramIndex++}`);
  queryState.queryParams.push(filters.recruiterId);
}

function addHiringManagerFilter(filters: PositionListFilters, queryState: PositionFilterConditions) {
  if (!filters.hiringManagerId) {
    return;
  }

  queryState.hiringManagerJoinClause = 'INNER JOIN "PositionInterviewer" pif ON p.id = pif."positionId"';
  queryState.conditions.push(`pif."userId" = $${queryState.paramIndex++}`);
  queryState.queryParams.push(filters.hiringManagerId);
}

async function addAssignedHiringManagerFilter(
  session: Session,
  queryState: PositionFilterConditions,
) {
  if (session.user.role !== 'Hiring Manager' || hasPermission(session.user, 'POSITIONS_VIEW_ALL')) {
    return;
  }

  const restrictSetting = await getSystemSetting('hiringManagerRestrictToAssignedPositions');
  if (restrictSetting === 'false') {
    return;
  }

  queryState.conditions.push(`pi."userId" = $${queryState.paramIndex++}`);
  queryState.queryParams.push(session.user.id);
  queryState.interviewerJoinClause = 'INNER JOIN "PositionInterviewer" pi ON p.id = pi."positionId"';
}
