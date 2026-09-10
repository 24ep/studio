import type { Applicant, Position } from '../../lib/types';

type PositionLike = Pick<Position, 'id' | 'isOpen'>;

export function getOpenPositionsWithNoApplicants(
  positions: PositionLike[],
  applicants: Array<Pick<Applicant, 'positionId'>>
) {
  const applicantPositionIds = new Set(applicants.map(applicant => applicant.positionId).filter(Boolean));
  return positions.filter(position => position.isOpen && !applicantPositionIds.has(position.id));
}

export function paginateDashboardItems<T>(items: T[], page: number, pageSize: number) {
  const safePage = page > 0 ? page : 1;
  const safePageSize = pageSize > 0 ? pageSize : 5;
  const startIndex = (safePage - 1) * safePageSize;
  return items.slice(startIndex, startIndex + safePageSize);
}

export function createPlaceholderList(count: number) {
  return Array(Math.max(0, count)).fill(null);
}
