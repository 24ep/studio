import { appendCondition } from './applicants-route-list-where-state';
import type { ApplicantRouteFilters } from './applicants-route-query-types';
import type { ApplicantRouteWhereInput, ApplicantRouteWhereState } from './applicants-route-list-where-types';

export function appendRecruiterFilter(state: ApplicantRouteWhereState, recruiterId?: string) {
  if (!recruiterId) {
    return;
  }

  const recruiterIds = recruiterId.split(',').map(id => id.trim()).filter(Boolean);
  if (recruiterIds.includes('select-all')) {
    return;
  }

  if (recruiterIds.length === 1 && recruiterIds[0] === 'unassigned') {
    state.whereClauses.push(`c."recruiterId" IS NULL`);
    return;
  }

  if (recruiterIds.length === 1) {
    appendCondition(state, `c."recruiterId" = $${state.paramIndex++}`, [recruiterIds[0]]);
    return;
  }

  const assignedIds = recruiterIds.filter(id => id !== 'unassigned');
  const hasUnassigned = recruiterIds.includes('unassigned');

  if (assignedIds.length > 0 && hasUnassigned) {
    appendCondition(state, `(c."recruiterId" IS NULL OR c."recruiterId" = ANY($${state.paramIndex++}::uuid[]))`, [assignedIds]);
  } else if (assignedIds.length > 0) {
    appendCondition(state, `c."recruiterId" = ANY($${state.paramIndex++}::uuid[])`, [assignedIds]);
  } else if (hasUnassigned) {
    state.whereClauses.push(`c."recruiterId" IS NULL`);
  }
}

export async function appendUserVisibilityFilters({
  state,
  filters,
  user,
  hasPermission,
  readSystemSetting,
}: {
  state: ApplicantRouteWhereState;
  filters: ApplicantRouteFilters;
  user: ApplicantRouteWhereInput['user'];
  hasPermission: ApplicantRouteWhereInput['hasPermission'];
  readSystemSetting: ApplicantRouteWhereInput['readSystemSetting'];
}) {
  const isRecruiterViewRestricted = !hasPermission(user, 'applicantS_VIEW');
  if (isRecruiterViewRestricted && !filters.recruiterId && !filters.positionId) {
    appendCondition(state, `c."recruiterId" = $${state.paramIndex++}`, [user.id]);
  }

  const isHiringManager = user.role === 'Hiring Manager';
  if (!isHiringManager || hasPermission(user, 'applicantS_VIEW_ALL')) {
    return;
  }

  const restrictSetting = await readSystemSetting('hiringManagerRestrictToAssignedPositions');
  if (restrictSetting === 'false') {
    return;
  }

  appendCondition(state, `EXISTS (
    SELECT 1 FROM "PositionInterviewer" pi
    WHERE pi."positionId" = c."positionId"
    AND pi."userId" = $${state.paramIndex++}
  )`, [user.id]);
}
