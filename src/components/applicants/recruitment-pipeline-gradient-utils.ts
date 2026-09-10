import type { RecruitmentStage, TransitionRecord } from "@/lib/types";

function getRecruitmentPipelineStageColor({
  currentStageIndex,
  index,
  records,
  stage,
}: {
  currentStageIndex: number;
  index: number;
  records: TransitionRecord[];
  stage: RecruitmentStage;
}) {
  const isCompleted = index < currentStageIndex;
  const isActuallyCompleted = isCompleted && records.length > 0;
  const isSkipped = isCompleted && records.length === 0;

  if (isActuallyCompleted) return stage.color_complete || "#22c55e";
  return isSkipped ? "#9ca3af" : "#d1d5db";
}

function getGradientPercent(index: number, stagesLength: number, offset: number) {
  if (stagesLength <= 1) {
    return offset === 0 ? 0 : 100;
  }

  return ((index + offset) / (stagesLength - 1)) * 100;
}

export function getRecruitmentPipelineLineGradient({
  currentStageIndex,
  stages,
  stageToRecords,
}: {
  currentStageIndex: number;
  stages: RecruitmentStage[];
  stageToRecords: Record<string, TransitionRecord[]>;
}) {
  if (stages.length === 0) {
    return "#d1d5db";
  }

  const colorStops = stages.map((stage, index) => {
    const records = stageToRecords[stage.id] || [];
    const color = getRecruitmentPipelineStageColor({
      currentStageIndex,
      index,
      records,
      stage,
    });

    return `${color} ${getGradientPercent(index, stages.length, 0)}%, ${color} ${getGradientPercent(index, stages.length, 1)}%`;
  });

  return `linear-gradient(to right, ${colorStops.join(", ")})`;
}
