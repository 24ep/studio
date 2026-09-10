import type { Applicant, Position } from '@/lib/types';

export function getMissingApplicantPositionIds(
  applicants?: Array<Pick<Applicant, 'positionId'>> | null,
  positions?: Array<Pick<Position, 'id'>> | null
) {
  if (!Array.isArray(applicants)) return [];

  const availablePositionIds = new Set(
    (Array.isArray(positions) ? positions : [])
      .map(position => position?.id)
      .filter((id): id is string => typeof id === 'string' && id.length > 0)
  );

  return Array.from(new Set(
    applicants
      .map(applicant => applicant?.positionId)
      .filter((positionId): positionId is string => (
        typeof positionId === 'string' &&
        positionId.length > 0 &&
        !availablePositionIds.has(positionId)
      ))
  ));
}

export function mergePositionsById<T extends { id?: string }>(
  currentPositions?: T[] | null,
  incomingPositions?: T[] | null
) {
  const safeCurrent = Array.isArray(currentPositions) ? currentPositions : [];
  const knownIds = new Set(safeCurrent.map(position => position?.id).filter(Boolean));
  const safeIncoming = Array.isArray(incomingPositions) ? incomingPositions : [];

  return [
    ...safeCurrent,
    ...safeIncoming.filter(position => {
      if (!position?.id || knownIds.has(position.id)) return false;
      knownIds.add(position.id);
      return true;
    }),
  ];
}
