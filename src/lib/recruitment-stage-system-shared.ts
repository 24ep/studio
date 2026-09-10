export const REQUIRED_RECRUITMENT_STAGE_NAMES = ['Applied', 'Hired', 'Rejected'] as const;

export const OPTIONAL_RECRUITMENT_STAGE_NAMES = [
  'Screening',
  'Shortlisted',
  'Interview Scheduled',
  'Interviewing',
  'Offer Extended',
  'Offer Accepted',
  'On Hold',
] as const;

const REQUIRED_RECRUITMENT_STAGE_NAME_SET = new Set<string>(REQUIRED_RECRUITMENT_STAGE_NAMES);

export type RecruitmentStageSystemFields = {
  isSystem?: boolean;
  is_system?: boolean;
};

export function isSystemRecruitmentStage(stage: RecruitmentStageSystemFields) {
  return stage.isSystem === true || stage.is_system === true;
}

export function isRequiredRecruitmentStageName(name: string) {
  return REQUIRED_RECRUITMENT_STAGE_NAME_SET.has(name);
}
