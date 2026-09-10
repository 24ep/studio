import type { BoardApplicant, PossibleBoardValueOptions } from './customize-board-types';

const DEFAULT_STAGE_NAMES = [
  'Applied',
  'Screening',
  'Interview Scheduled',
  'Interviewing',
  'Offer Sent',
  'Offer Accepted',
  'Hired',
  'Rejected',
  'Withdrawn',
];

const DEFAULT_FIT_SCORE_BUCKETS = ['0-20', '21-40', '41-60', '61-80', '81-100'];
const DEFAULT_FIELD_VALUES = ['Option 1', 'Option 2', 'Option 3'];

export function getAllPossibleBoardValues({
  applicants,
  cleanRowFieldValues,
  fieldKey,
  positions,
  recruiters,
  stages,
}: PossibleBoardValueOptions) {
  switch (fieldKey) {
    case 'none':
      return ['No grouping'];
    case 'status':
      return stages.length > 0 ? stages.map(stage => stage.name) : DEFAULT_STAGE_NAMES;
    case 'recruiterId':
      return recruiters.length > 0 ? recruiters.map(recruiter => recruiter.name || recruiter.id) : ['No recruiters available'];
    case 'positionId':
      return positions.length > 0 ? positions.map(position => position.title || position.id) : ['No positions available'];
    case 'fitScore':
      return getFitScoreBuckets(applicants);
    default:
      return getApplicantFieldValues(applicants, fieldKey, cleanRowFieldValues);
  }
}

function getFitScoreBuckets(applicants: BoardApplicant[]) {
  if (applicants.length === 0) {
    return DEFAULT_FIT_SCORE_BUCKETS;
  }

  const scores = applicants.map(applicant => applicant.fitScore).filter((score): score is number => typeof score === 'number');

  if (scores.length === 0) {
    return DEFAULT_FIT_SCORE_BUCKETS;
  }

  const min = Math.min(...scores);
  const max = Math.max(...scores);

  if (min === max) {
    return DEFAULT_FIT_SCORE_BUCKETS;
  }

  if (max - min <= 1) {
    return Array.from(new Set(scores)).map(value => value.toString());
  }

  return [
    `${min}-${Math.round((min + max) / 4)}`,
    `${Math.round((min + max) / 4) + 1}-${Math.round((min + max) / 2)}`,
    `${Math.round((min + max) / 2) + 1}-${Math.round((min + max) * 3 / 4)}`,
    `${Math.round((min + max) * 3 / 4) + 1}-${max}`,
  ];
}

function getApplicantFieldValues(applicants: BoardApplicant[], fieldKey: string, cleanRowFieldValues: string[]) {
  if (applicants.length === 0) {
    return cleanRowFieldValues.length > 0 ? cleanRowFieldValues : DEFAULT_FIELD_VALUES;
  }

  const values = applicants
    .map(applicant => applicant[fieldKey] ?? applicant.customAttributes?.[fieldKey])
    .filter(value => value !== null && value !== undefined && value !== '');
  const uniqueValues = [...new Set(values)];

  return uniqueValues.length > 0
    ? uniqueValues.map(String)
    : cleanRowFieldValues.length > 0
      ? cleanRowFieldValues
      : DEFAULT_FIELD_VALUES;
}
