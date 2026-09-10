import { hasPermission } from '@/lib/permissions';
import type {
  TaskboardApplicantFilters,
  TaskboardQueryParts,
  TaskboardSession,
} from './taskboard-applicants-types';

export function appendRecruiterViewFilter(
  parts: TaskboardQueryParts,
  filters: TaskboardApplicantFilters,
  session: TaskboardSession,
) {
  const isRecruiterViewRestricted = !hasPermission(session.user, 'applicantS_VIEW');
  if (isRecruiterViewRestricted && !filters.recruiterId && !filters.positionId) {
    parts.whereClauses.push(`c."recruiterId" = $${parts.paramIndex++}`);
    parts.queryParams.push(session.user.id);
  }
}

export async function appendHiringManagerFilter(
  parts: TaskboardQueryParts,
  session: TaskboardSession,
) {
  if (session.user.role !== 'Hiring Manager') return;

  const hasViewAllPermission = hasPermission(session.user, 'applicantS_VIEW_ALL');
  if (hasViewAllPermission) return;

  const { getSystemSetting } = await import('@/lib/systemSettings');
  const restrictSetting = await getSystemSetting('hiringManagerRestrictToAssignedPositions');
  const shouldRestrict = restrictSetting !== 'false';
  if (!shouldRestrict) return;

  parts.whereClauses.push(`EXISTS (
    SELECT 1 FROM "PositionInterviewer" pi
    WHERE pi."positionId" = c."positionId"
    AND pi."userId" = $${parts.paramIndex++}
  )`);
  parts.queryParams.push(session.user.id);
}
