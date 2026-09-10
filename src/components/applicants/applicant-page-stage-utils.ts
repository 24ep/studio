import type { Applicant, RecruitmentStage } from '@/lib/types';

export function countApplicantsByStage(applicants?: Applicant[] | null) {
  const stageCounts: Record<string, number> = {};
  const applicantsArray = Array.isArray(applicants) ? applicants : [];

  for (const applicant of applicantsArray) {
    const status = applicant.statusId || applicant.status || 'unknown';
    stageCounts[status] = (stageCounts[status] || 0) + 1;
  }

  return stageCounts;
}

export function buildApplicantStageNames(stages?: Array<Pick<RecruitmentStage, 'id' | 'name'>> | null) {
  const stagesArray = Array.isArray(stages) ? stages : [];

  return stagesArray.reduce<Record<string, string>>((namesById, stage) => {
    if (stage.id && stage.name) {
      namesById[stage.id] = stage.name;
    }

    return namesById;
  }, {});
}

export function getUniqueApplicantStageIds(applicants?: Array<Pick<Applicant, 'statusId'>> | null) {
  const applicantsArray = Array.isArray(applicants) ? applicants : [];
  const stageIds = new Set<string>();

  for (const applicant of applicantsArray) {
    if (applicant.statusId) {
      stageIds.add(applicant.statusId);
    }
  }

  return Array.from(stageIds);
}
