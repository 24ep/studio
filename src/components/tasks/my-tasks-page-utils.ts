export type {
  MyTasksFilters,
  MyTasksRecruiter,
  MyTasksStage,
  TaskboardApplicant,
  TaskboardStageResponse,
} from "./my-tasks-page-types";
export {
  buildTaskboardApplicantParams,
  filterTaskboardApplicants,
  getTaskboardApplicantsEndpoint,
  hasTaskboardFilterValues,
} from "./my-tasks-page-filter-utils";
export {
  convertApplicantsToTasks,
  getTaskApplicantDisplayName,
  haveTaskboardApplicantSnapshotsChanged,
} from "./my-tasks-page-applicant-utils";
export {
  buildTaskboardFitScoreCounts,
  getTaskboardFitScoreGrade,
  TASKBOARD_NO_SCORE_GRADE,
} from "./my-tasks-fit-score-utils";
export {
  buildTaskStageNames,
  convertStagesToTaskStages,
  filterTaskStagesBySelection,
  normalizeTaskboardStagesResponse,
  toggleTaskStageSelection,
} from "./my-tasks-page-stage-utils";

export function getTaskMoveUpdatedCount(data: unknown) {
  const updatedCount = data && typeof data === "object" && !Array.isArray(data)
    ? (data as Record<string, unknown>).updatedCount
    : undefined;

  return typeof updatedCount === "number" ? updatedCount : 0;
}
