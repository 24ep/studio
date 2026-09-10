import type { MyTasksFilters } from "./my-tasks-page-utils";

export interface MyTasksFilterStage {
  id?: string;
  name?: string;
  label?: string;
}

export interface MyTasksFilterPosition {
  id: string;
  title?: string;
}

export interface MyTasksFilterRecruiter {
  id: string;
  name?: string;
  avatarUrl?: string;
  personalColor?: string;
}

export interface ActiveTaskFilterBadge {
  key: string;
  label: string;
  displayValue: string;
}

const FILTER_LABELS: Record<string, string> = {
  applicationDateEnd: "To Date",
  applicationDateStart: "From Date",
  assignmentStatus: "Assignment",
  maxFitScore: "Max Score",
  minFitScore: "Min Score",
  fitScoreGrades: "Fit Score",
  name: "Name",
  positionId: "Position",
  positionStatus: "Position",
  recruiterId: "Recruiter",
  scoreStatus: "Score",
  stage: "Stage",
};

export function parseTaskFilterRecruiterIds(filters: MyTasksFilters) {
  return typeof filters.recruiterId === "string" && filters.recruiterId
    ? filters.recruiterId.split(",").filter(Boolean)
    : [];
}

export function isActiveTaskFilterValue(value: unknown) {
  return value !== undefined &&
    value !== "" &&
    value !== null &&
    !(Array.isArray(value) && value.length === 0);
}

export function getTaskFilterActiveCount(filters: MyTasksFilters, selectedRecruiters: Set<string>) {
  return Object.keys(filters).filter((key) => isActiveTaskFilterValue(filters[key])).length +
    (selectedRecruiters.size > 0 && !isActiveTaskFilterValue(filters.recruiterId) ? 1 : 0);
}

export function hasActiveTaskFilters(filters: MyTasksFilters, selectedRecruiters: Set<string>) {
  return Object.keys(filters).some((key) => isActiveTaskFilterValue(filters[key])) ||
    selectedRecruiters.size > 0;
}

export function updateTaskFilter(
  filters: MyTasksFilters,
  key: keyof MyTasksFilters,
  value: unknown,
): MyTasksFilters {
  return {
    ...filters,
    [key]: value === "" ? undefined : value,
  };
}

export function updateTaskFilterRecruiters(filters: MyTasksFilters, selectedRecruiters: Set<string>) {
  const recruiterIds = Array.from(selectedRecruiters);

  return {
    ...filters,
    recruiterId: recruiterIds.length > 0 ? recruiterIds.join(",") : undefined,
  };
}

function formatDateFilterValue(value: unknown) {
  return typeof value === "string" && value
    ? new Date(value).toLocaleDateString()
    : String(value);
}

function formatRecruiterFilterValue(value: unknown, recruiters: MyTasksFilterRecruiter[]) {
  return String(value).split(",").filter(Boolean).map((id) => {
    if (id === "unassigned") {
      return "Unassigned";
    }

    return recruiters.find((recruiter) => recruiter.id === id)?.name || id;
  }).join(", ");
}

function formatEnumFilterValue(key: string, value: unknown) {
  const enumLabels: Record<string, Record<string, string>> = {
    assignmentStatus: {
      assigned: "Assigned",
      unassigned: "Unassigned",
    },
    positionStatus: {
      "with-position": "Has position",
      "without-position": "No position",
    },
    scoreStatus: {
      scored: "Has fit score",
      unscored: "No fit score",
    },
  };

  return enumLabels[key]?.[String(value)] || String(value);
}

type TaskFilterBadgeFormatter = (
  value: unknown,
  context: {
    positions: MyTasksFilterPosition[];
    recruiters: MyTasksFilterRecruiter[];
  }
) => string;

const FILTER_BADGE_FORMATTERS: Record<string, TaskFilterBadgeFormatter> = {
  fitScoreGrades: (value) => (
    Array.isArray(value)
      ? value.map((grade) => grade === "no-score" ? "No Score" : String(grade)).join(", ")
      : String(value)
  ),
  positionId: (value, { positions }) => (
    positions.find((position) => position.id === value)?.title || String(value)
  ),
  recruiterId: (value, { recruiters }) => formatRecruiterFilterValue(value, recruiters),
  applicationDateStart: formatDateFilterValue,
  applicationDateEnd: formatDateFilterValue,
  assignmentStatus: (value) => formatEnumFilterValue("assignmentStatus", value),
  positionStatus: (value) => formatEnumFilterValue("positionStatus", value),
  scoreStatus: (value) => formatEnumFilterValue("scoreStatus", value),
};

export function buildTaskFilterBadges(
  filters: MyTasksFilters,
  positions: MyTasksFilterPosition[],
  recruiters: MyTasksFilterRecruiter[],
): ActiveTaskFilterBadge[] {
  return Object.entries(filters).flatMap(([key, value]) => {
    if (!isActiveTaskFilterValue(value)) {
      return [];
    }

    const formatter = FILTER_BADGE_FORMATTERS[key];
    const displayValue = formatter
      ? formatter(value, { positions, recruiters })
      : String(value);

    return [{
      key,
      label: FILTER_LABELS[key] || key,
      displayValue,
    }];
  });
}

export function getStageOptionValue(stage: MyTasksFilterStage | string) {
  return typeof stage === "string"
    ? stage
    : stage.name || stage.label || stage.id || "";
}

export function getStageOptionLabel(stage: MyTasksFilterStage | string) {
  return typeof stage === "string"
    ? stage
    : stage.label || stage.name || stage.id || "";
}
