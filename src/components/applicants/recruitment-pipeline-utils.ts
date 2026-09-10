import type { RecruitmentStage, TransitionRecord } from "@/lib/types";
import {
  formatRecruitmentPipelineDuration,
  getRecruitmentPipelineDurationLabel,
} from "./recruitment-pipeline-duration-utils";
import {
  getRecruitmentPipelineLineGradient,
} from "./recruitment-pipeline-gradient-utils";
import {
  buildRecruitmentPipelineStageView,
} from "./recruitment-pipeline-stage-utils";

export {
  formatRecruitmentPipelineDuration,
  getRecruitmentPipelineDurationLabel,
  getRecruitmentPipelineLineGradient,
};

export interface RecruitmentPipelineStageView {
  durationLabel: string;
  index: number;
  isActuallyCompleted: boolean;
  isCurrent: boolean;
  isFuture: boolean;
  isReached: boolean;
  isSkipped: boolean;
  latestRecord: TransitionRecord | null;
  records: TransitionRecord[];
  stage: RecruitmentStage;
  statusLabel: string;
  title: string;
}

export function groupRecruitmentTransitionsByStage(transitionHistory?: TransitionRecord[] | null) {
  const stageToRecords: Record<string, TransitionRecord[]> = {};

  if (!Array.isArray(transitionHistory)) {
    return stageToRecords;
  }

  transitionHistory.forEach((record) => {
    if (!stageToRecords[record.stage]) {
      stageToRecords[record.stage] = [];
    }
    stageToRecords[record.stage].push(record);
  });

  return stageToRecords;
}

export function buildRecruitmentPipelineStages({
  currentStatus,
  stages,
  stageToRecords,
  transitionHistory,
}: {
  currentStatus: string;
  stages: RecruitmentStage[];
  stageToRecords: Record<string, TransitionRecord[]>;
  transitionHistory: TransitionRecord[];
}) {
  const currentStageIndex = stages.length > 0
    ? stages.findIndex((stage) => stage.id === currentStatus)
    : -1;

  const stageViews = stages.map((stage, index) => {
    const records = stageToRecords[stage.id] || [];

    return buildRecruitmentPipelineStageView({
      currentStageIndex,
      currentStatus,
      index,
      records,
      stage,
      transitionHistory,
    });
  });

  return { currentStageIndex, stageViews };
}
