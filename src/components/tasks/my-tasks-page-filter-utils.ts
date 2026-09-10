import type { MyTasksFilters, TaskboardApplicant } from "./my-tasks-page-types";
import { matchesTaskboardApplicantFilters } from "./my-tasks-page-applicant-filter-matchers";

const TASKBOARD_ALL_APPLICANTS_ENDPOINT = "/api/taskboard/applicants?limit=50000&page=1";

const TASKBOARD_FILTER_PARAM_KEYS = [
  ["name", "name"],
  ["positionId", "positionId"],
  ["recruiterId", "recruiterId"],
  ["minFitScore", "minFitScore"],
  ["maxFitScore", "maxFitScore"],
  ["applicationDateStart", "applicationDateStart"],
  ["applicationDateEnd", "applicationDateEnd"],
  ["assignmentStatus", "assignmentStatus"],
  ["positionStatus", "positionStatus"],
  ["scoreStatus", "scoreStatus"],
] as const;

function normalizeStringFilter(value: string | string[] | undefined) {
  return Array.isArray(value) ? value.join(",") : value;
}

function appendTaskboardParamIfActive(
  params: URLSearchParams,
  key: string,
  value: unknown,
) {
  if (value !== undefined && value !== null && value !== "") {
    params.append(key, String(value));
  }
}

export function buildTaskboardApplicantParams(filters: MyTasksFilters = {}) {
  const params = new URLSearchParams();
  const stage = normalizeStringFilter(filters.stage);

  for (const [filterKey, paramKey] of TASKBOARD_FILTER_PARAM_KEYS) {
    appendTaskboardParamIfActive(params, paramKey, filters[filterKey]);
  }
  appendTaskboardParamIfActive(params, "status", stage);
  params.append("limit", "50000");
  params.append("page", "1");
  return params;
}

function isActiveTaskboardFilterValue(value: unknown) {
  return value !== undefined &&
    value !== null &&
    value !== "" &&
    !(Array.isArray(value) && value.length === 0);
}

export function hasTaskboardFilterValues(filters: MyTasksFilters = {}) {
  return Object.values(filters).some(isActiveTaskboardFilterValue);
}

export function getTaskboardApplicantsEndpoint(filters: MyTasksFilters = {}) {
  if (!hasTaskboardFilterValues(filters)) {
    return TASKBOARD_ALL_APPLICANTS_ENDPOINT;
  }

  return `/api/taskboard/applicants?${buildTaskboardApplicantParams(filters).toString()}`;
}

export function filterTaskboardApplicants(applicants: TaskboardApplicant[], filters: MyTasksFilters = {}) {
  if (!Array.isArray(applicants)) {
    return [];
  }

  return applicants.filter((applicant) => matchesTaskboardApplicantFilters(applicant, filters));
}
