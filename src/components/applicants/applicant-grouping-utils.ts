import type { Applicant, Position } from '@/lib/types';
import type { ApplicantGroupBy } from './applicant-settings-types';

export const APPLICANT_GROUP_BY_OPTIONS: Array<{ value: ApplicantGroupBy; label: string }> = [
  { value: 'none', label: 'None' },
  { value: 'position', label: 'Position' },
  { value: 'recruiter', label: 'Recruiter' },
  { value: 'status', label: 'Status' },
];

export interface ApplicantGroup {
  key: string;
  label: string;
  applicants: Applicant[];
}

export function getApplicantGroupLabel({
  applicant,
  availablePositions,
  availableRecruiter,
  groupBy,
  stageNames,
}: {
  applicant: Applicant;
  availablePositions: Position[];
  availableRecruiter: Array<{ id: string; name: string }>;
  groupBy: ApplicantGroupBy;
  stageNames: Record<string, string>;
}) {
  if (groupBy === 'position') {
    return (
      applicant.position?.title ||
      availablePositions.find((position) => position.id === applicant.positionId)?.title ||
      'No position'
    );
  }

  if (groupBy === 'recruiter') {
    return (
      applicant.recruiter?.name ||
      availableRecruiter.find((recruiter) => recruiter.id === applicant.recruiterId)?.name ||
      'Unassigned recruiter'
    );
  }

  if (groupBy === 'status') {
    return (
      applicant.status ||
      applicant.recruitmentStage?.name ||
      stageNames[applicant.statusId] ||
      'No status'
    );
  }

  return 'All applicants';
}

export function groupApplicantsForApplicantPage({
  applicants,
  availablePositions,
  availableRecruiter,
  groupBy,
  stageNames,
}: {
  applicants: Applicant[];
  availablePositions: Position[];
  availableRecruiter: Array<{ id: string; name: string }>;
  groupBy: ApplicantGroupBy;
  stageNames: Record<string, string>;
}): ApplicantGroup[] {
  if (groupBy === 'none') {
    return [{ key: 'all', label: 'All applicants', applicants }];
  }

  const groups = new Map<string, ApplicantGroup>();

  applicants.forEach((applicant) => {
    const label = getApplicantGroupLabel({
      applicant,
      availablePositions,
      availableRecruiter,
      groupBy,
      stageNames,
    });
    const key = `${groupBy}:${label.toLowerCase()}`;
    const current = groups.get(key);

    if (current) {
      current.applicants.push(applicant);
      return;
    }

    groups.set(key, {
      key,
      label,
      applicants: [applicant],
    });
  });

  return Array.from(groups.values());
}
