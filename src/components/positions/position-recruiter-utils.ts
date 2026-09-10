import type { Position } from '@/lib/types';

export type PositionRecruiterOption = {
  id: string;
  name: string;
  avatarUrl?: string;
  personalColor?: string;
  vacantHeadcount?: number;
};

type RecruiterHeadcountRecord = {
  id?: unknown;
  name?: unknown;
  avatarUrl?: string;
  personalColor?: string;
  totalPositions?: number;
  vacantHeadcount?: number;
};

type RecruiterHeadcountResponse = {
  recruiters?: RecruiterHeadcountRecord[];
  unassigned?: {
    totalPositions?: number;
    vacantHeadcount?: number;
  };
};

type PositionWithLegacyCustomAttributes = Position & {
  custom_attributes?: Record<string, unknown> | null;
};

export type AssignedPositionResponse = Partial<PositionWithLegacyCustomAttributes> & {
  id?: string;
  recruiterId?: string | null;
  recruiterName?: string | null;
};

type RecruiterSyncResponse = {
  applicantsUpdated?: number;
};

function isRecruiterHeadcountResponse(data: unknown): data is RecruiterHeadcountResponse {
  return typeof data === 'object' && data !== null;
}

export function normalizePositionRecruiterStats(data: unknown) {
  const safeData = isRecruiterHeadcountResponse(data) ? data : {};
  const recruiters = Array.isArray(safeData.recruiters) ? safeData.recruiters : [];
  const availableRecruiters: PositionRecruiterOption[] = recruiters
    .filter((recruiter): recruiter is RecruiterHeadcountRecord & { id: string; name: string } => (
      typeof recruiter.id === 'string' && typeof recruiter.name === 'string'
    ))
    .map(recruiter => ({
      id: recruiter.id,
      name: recruiter.name,
      avatarUrl: recruiter.avatarUrl,
      personalColor: recruiter.personalColor,
      vacantHeadcount: recruiter.vacantHeadcount,
    }));

  const stats = recruiters.reduce<Record<string, number>>((acc, recruiter) => {
    if (typeof recruiter.id === 'string') {
      acc[recruiter.id] = recruiter.totalPositions || 0;
    }
    return acc;
  }, {});

  stats.unassigned = safeData.unassigned?.totalPositions || 0;
  stats.unassignedVacant = safeData.unassigned?.vacantHeadcount || 0;

  return { availableRecruiters, stats };
}

export function getRecruiterNameById(
  recruiters: PositionRecruiterOption[],
  recruiterId: string | null
) {
  if (!recruiterId) return null;

  return recruiters.find(recruiter => recruiter.id === recruiterId)?.name || null;
}

export function applyOptimisticRecruiterAssignment(
  positions: Position[],
  positionId: string,
  recruiterId: string | null,
  recruiterName: string | null
) {
  return positions.map(position => (
    position.id === positionId
      ? {
        ...position,
        recruiterId,
        recruiterName,
      }
      : position
  ));
}

export function getAssignedPositionFromResponse(responseData: unknown): AssignedPositionResponse | null {
  const position = (responseData as { position?: unknown } | null | undefined)?.position;
  if (!position || typeof position !== 'object') return null;

  return position as AssignedPositionResponse;
}

export function applyAssignedPositionResponse(
  positions: Position[],
  positionId: string,
  updatedPosition: AssignedPositionResponse,
  fallbackRecruiterName: string | null
) {
  return positions.map(position => {
    if (position.id !== positionId) return position;

    const customAttributes = updatedPosition.custom_attributes || updatedPosition.customAttributes || {};

    return {
      ...position,
      ...updatedPosition,
      custom_attributes: customAttributes,
      recruiterName: updatedPosition.recruiterName || fallbackRecruiterName || null,
    } as Position;
  });
}

export function getRecruiterSyncApplicantCount(responseData: unknown) {
  const sync = (responseData as { recruiterSync?: RecruiterSyncResponse } | null | undefined)?.recruiterSync;
  return sync?.applicantsUpdated || 0;
}

export function getRecruiterAssignmentSuccessMessage(
  recruiterId: string | null,
  applicantsUpdated: number
) {
  if (applicantsUpdated > 0) {
    return `Recruiter assigned successfully. ${applicantsUpdated} applicant${applicantsUpdated > 1 ? 's' : ''} automatically assigned.`;
  }

  return recruiterId ? 'Recruiter assigned successfully' : 'Recruiter unassigned successfully';
}
