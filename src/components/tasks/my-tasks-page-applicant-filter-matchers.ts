import type { MyTasksFilters, TaskboardApplicant } from './my-tasks-page-types';
import { getTaskboardFitScoreGrade } from './my-tasks-fit-score-utils';

type TaskboardApplicantMatcher = (applicant: TaskboardApplicant, filters: MyTasksFilters) => boolean;

const taskboardApplicantMatchers: TaskboardApplicantMatcher[] = [
  matchesTaskboardFitScoreRange,
  matchesTaskboardFitScoreGrades,
  matchesTaskboardApplicationDateRange,
  matchesTaskboardAssignmentStatus,
  matchesTaskboardPositionStatus,
  matchesTaskboardScoreStatus,
];

export function matchesTaskboardApplicantFilters(
  applicant: TaskboardApplicant,
  filters: MyTasksFilters,
) {
  return taskboardApplicantMatchers.every((matcher) => matcher(applicant, filters));
}

function matchesTaskboardFitScoreRange(applicant: TaskboardApplicant, filters: MyTasksFilters) {
  const fitScore = getTaskboardApplicantFitScore(applicant);
  if (filters.minFitScore !== undefined && fitScore < filters.minFitScore) return false;
  if (filters.maxFitScore !== undefined && fitScore > filters.maxFitScore) return false;
  return true;
}

function matchesTaskboardFitScoreGrades(applicant: TaskboardApplicant, filters: MyTasksFilters) {
  if (!Array.isArray(filters.fitScoreGrades) || filters.fitScoreGrades.length === 0) {
    return true;
  }

  return filters.fitScoreGrades.includes(getTaskboardFitScoreGrade(applicant));
}

function matchesTaskboardApplicationDateRange(applicant: TaskboardApplicant, filters: MyTasksFilters) {
  const applicationDate = getTaskboardApplicantApplicationDate(applicant);
  if (!applicationDate) return true;

  if (filters.applicationDateStart && applicationDate < new Date(filters.applicationDateStart)) {
    return false;
  }

  if (!filters.applicationDateEnd) {
    return true;
  }

  const endDate = new Date(filters.applicationDateEnd);
  endDate.setHours(23, 59, 59, 999);
  return applicationDate <= endDate;
}

function matchesTaskboardAssignmentStatus(applicant: TaskboardApplicant, filters: MyTasksFilters) {
  if (filters.assignmentStatus === 'assigned') return Boolean(applicant.recruiterId);
  if (filters.assignmentStatus === 'unassigned') return !applicant.recruiterId;
  return true;
}

function matchesTaskboardPositionStatus(applicant: TaskboardApplicant, filters: MyTasksFilters) {
  if (filters.positionStatus === 'with-position') return Boolean(applicant.positionId);
  if (filters.positionStatus === 'without-position') return !applicant.positionId;
  return true;
}

function matchesTaskboardScoreStatus(applicant: TaskboardApplicant, filters: MyTasksFilters) {
  const fitScore = getTaskboardApplicantFitScore(applicant);
  if (filters.scoreStatus === 'scored') return fitScore > 0;
  if (filters.scoreStatus === 'unscored') return fitScore <= 0;
  return true;
}

function getTaskboardApplicantFitScore(applicant: TaskboardApplicant) {
  return Number(applicant.fitScore || 0);
}

function getTaskboardApplicantApplicationDate(applicant: TaskboardApplicant) {
  return applicant.applicationDate ? new Date(applicant.applicationDate) : null;
}
