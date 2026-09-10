import type { TaskStage } from "@/components/tasks/TaskBoardTypes";
import type { MyTasksStage, TaskboardStageResponse } from "./my-tasks-page-types";

export function convertStagesToTaskStages(stages: MyTasksStage[]): TaskStage[] {
  return stages.map((stage, index) => ({
    id: stage.id,
    name: stage.name,
    color: stage.colorBadge || "#6b7280",
    description: stage.description || `Applicants in ${stage.name} stage`,
    sortOrder: stage.sortOrder || index,
    colorComplete: stage.colorComplete,
    isSystem: stage.isSystem,
  }));
}

export function toggleTaskStageSelection(selectedStages: string[], stageId: string) {
  return selectedStages.includes(stageId)
    ? selectedStages.filter((id) => id !== stageId)
    : [...selectedStages, stageId];
}

export function filterTaskStagesBySelection(stages: MyTasksStage[], selectedStages: string[]) {
  if (!Array.isArray(stages)) {
    return [];
  }

  if (selectedStages.length === 0) {
    return stages;
  }

  return stages.filter((stage) => selectedStages.includes(stage.id));
}

export function buildTaskStageNames(stages: MyTasksStage[]) {
  return stages.reduce<Record<string, string>>((map, stage) => {
    if (stage.id && stage.name) {
      map[stage.id] = stage.name;
    }

    return map;
  }, {});
}

export function normalizeTaskboardStagesResponse(stagesData: unknown): MyTasksStage[] {
  return Array.isArray(stagesData)
    ? stagesData.map((stage: TaskboardStageResponse) => ({
      id: String(stage.id || ""),
      name: String(stage.name || ""),
      description: typeof stage.description === "string" ? stage.description : undefined,
      sortOrder: typeof stage.sort_order === "number" ? stage.sort_order : undefined,
      colorComplete: typeof stage.color_complete === "string" ? stage.color_complete : undefined,
      colorBadge: typeof stage.color_badge === "string" ? stage.color_badge : undefined,
      isSystem: Boolean(stage.is_system),
    }))
    : [];
}
