import type { DuplicateAnalysisResult, DuplicateApplicant, DuplicateGroup } from './clear-duplicates-types';

function getDuplicateGroupKey(applicant: DuplicateApplicant) {
  return `${applicant.email.toLowerCase()}-${applicant.positionId || 'null'}`;
}

function compareCreatedAt(a: DuplicateApplicant, b: DuplicateApplicant) {
  const dateA = new Date(a.createdAt);
  const dateB = new Date(b.createdAt);

  if (Number.isNaN(dateA.getTime()) || Number.isNaN(dateB.getTime())) {
    return 0;
  }

  return dateA.getTime() - dateB.getTime();
}

export function findDuplicateApplicantGroups(applicants: DuplicateApplicant[]): DuplicateGroup[] {
  const applicantGroups = new Map<string, DuplicateGroup>();

  for (const applicant of applicants) {
    const key = getDuplicateGroupKey(applicant);
    const group = applicantGroups.get(key) || {
      email: applicant.email,
      positionId: applicant.positionId,
      applicants: [],
    };

    group.applicants.push(applicant);
    applicantGroups.set(key, group);
  }

  return Array.from(applicantGroups.values())
    .filter(group => group.applicants.length > 1);
}

export function analyzeDuplicateApplicants(applicants: DuplicateApplicant[]): DuplicateAnalysisResult {
  const duplicateGroups = findDuplicateApplicantGroups(applicants);
  const keptApplicants: DuplicateApplicant[] = [];
  const applicantsToDelete: DuplicateApplicant[] = [];

  for (const group of duplicateGroups) {
    const sortedApplicants = [...group.applicants].sort(compareCreatedAt);
    const [keptApplicant, ...toDelete] = sortedApplicants;

    keptApplicants.push(keptApplicant);
    applicantsToDelete.push(...toDelete);
  }

  return {
    duplicateGroups,
    keptApplicants,
    applicantsToDelete,
    totalToDelete: applicantsToDelete.length,
  };
}
