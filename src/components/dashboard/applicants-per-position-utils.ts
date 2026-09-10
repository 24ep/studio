import type { Applicant, Position } from '@/lib/types';

export interface ApplicantsPerPositionDatum {
  applicants: number;
  fullPositionTitle: string;
  position: string;
}

export function buildApplicantsPerPositionData(
  applicants: Applicant[],
  positions: Position[]
): ApplicantsPerPositionDatum[] {
  const safeApplicants = Array.isArray(applicants) ? applicants : [];
  const safePositions = Array.isArray(positions) ? positions : [];
  const applicantCountMap = new Map<string, number>();

  safeApplicants.forEach((applicant) => {
    if (applicant.positionId) {
      applicantCountMap.set(applicant.positionId, (applicantCountMap.get(applicant.positionId) || 0) + 1);
    }
  });

  return safePositions
    .map((position) => ({
      position: truncatePositionTitle(position.title),
      fullPositionTitle: position.title,
      applicants: applicantCountMap.get(position.id) || 0,
    }))
    .filter(item => item.applicants > 0)
    .sort((a, b) => b.applicants - a.applicants);
}

export function getApplicantsPerPositionTotal(data: ApplicantsPerPositionDatum[]) {
  return data.reduce((sum, item) => sum + item.applicants, 0);
}

function truncatePositionTitle(title: string) {
  return title.length > 15 ? `${title.substring(0, 12)}...` : title;
}
