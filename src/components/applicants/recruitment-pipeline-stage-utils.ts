import type { RecruitmentStage, TransitionRecord } from "@/lib/types";
import {
  getRecruitmentPipelineDurationLabel,
} from "./recruitment-pipeline-duration-utils";
import type { RecruitmentPipelineStageView } from "./recruitment-pipeline-utils";

interface RecruitmentPipelineStageFlags {
  isActuallyCompleted: boolean;
  isCurrent: boolean;
  isFuture: boolean;
  isReached: boolean;
  isSkipped: boolean;
}

function getRecruitmentPipelineStageFlags({
  currentStageIndex,
  currentStatus,
  index,
  records,
  stage,
}: {
  currentStageIndex: number;
  currentStatus: string;
  index: number;
  records: TransitionRecord[];
  stage: RecruitmentStage;
}): RecruitmentPipelineStageFlags {
  const isCurrent = currentStatus === stage.id;
  const isFuture = index > currentStageIndex;
  const isSkipped = index < currentStageIndex && records.length === 0;
  const isActuallyCompleted = index < currentStageIndex && records.length > 0;

  return {
    isActuallyCompleted,
    isCurrent,
    isFuture,
    isReached: index <= currentStageIndex,
    isSkipped,
  };
}

function getRecruitmentPipelineStatusLabel({
  isActuallyCompleted,
  isCurrent,
  isSkipped,
}: RecruitmentPipelineStageFlags) {
  if (isSkipped) return "Skipped Stage";
  if (isActuallyCompleted) return "Completed Stage";
  return isCurrent ? "Current Stage" : "Future Stage";
}

function buildRecruitmentPipelineTitle(
  stage: RecruitmentStage,
  statusLabel: string,
  recordCount: number
) {
  const updateText = recordCount > 0
    ? ` (${recordCount} update${recordCount > 1 ? "s" : ""})`
    : "";

  return `${stage.name} - ${statusLabel.replace(" Stage", "")} stage${updateText}`;
}

export function buildRecruitmentPipelineStageView({
  currentStageIndex,
  currentStatus,
  index,
  records,
  stage,
  transitionHistory,
}: {
  currentStageIndex: number;
  currentStatus: string;
  index: number;
  records: TransitionRecord[];
  stage: RecruitmentStage;
  transitionHistory: TransitionRecord[];
}): RecruitmentPipelineStageView {
  const flags = getRecruitmentPipelineStageFlags({
    currentStageIndex,
    currentStatus,
    index,
    records,
    stage,
  });
  const latestRecord = records.length > 0 ? records[records.length - 1] : null;
  const statusLabel = getRecruitmentPipelineStatusLabel(flags);

  return {
    durationLabel: getRecruitmentPipelineDurationLabel({
      isActuallyCompleted: flags.isActuallyCompleted,
      isCurrent: flags.isCurrent,
      isSkipped: flags.isSkipped,
      latestRecord,
      stageId: stage.id,
      transitionHistory,
    }),
    index,
    ...flags,
    latestRecord,
    records,
    stage,
    statusLabel,
    title: buildRecruitmentPipelineTitle(stage, statusLabel, records.length),
  };
}
