"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  groupTransitionRecordsByStage,
} from "./stage-pipeline-utils";
import type { StagePipelineProps, StagePipelineStageViewModel } from "./StagePipelineTypes";

const STAGE_TRANSITION_TIMEOUT_MS = 5000;

export function useStagePipeline({
  stages,
  transitionHistory,
  currentStatus,
  onStageClick,
}: Pick<StagePipelineProps, "stages" | "transitionHistory" | "currentStatus" | "onStageClick">) {
  const [openPopoverIdx, setOpenPopoverIdx] = useState<number | null>(null);
  const [localStages, setLocalStages] = useState(stages);
  const [localTransitionHistory, setLocalTransitionHistory] = useState(transitionHistory);
  const [localCurrentStatus, setLocalCurrentStatus] = useState(currentStatus);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const transitioningTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setLocalStages(stages);
  }, [stages]);

  useEffect(() => {
    setLocalTransitionHistory(transitionHistory);
  }, [transitionHistory]);

  useEffect(() => {
    setLocalCurrentStatus(currentStatus);
    setIsTransitioning(false);
  }, [currentStatus]);

  useEffect(() => {
    return () => {
      clearTransitioningTimeout(transitioningTimeoutRef);
    };
  }, []);

  const handleStageClick = useCallback((stageName: string) => {
    if (stageName !== localCurrentStatus) {
      setIsTransitioning(true);
      clearTransitioningTimeout(transitioningTimeoutRef);
      transitioningTimeoutRef.current = setTimeout(
        () => setIsTransitioning(false),
        STAGE_TRANSITION_TIMEOUT_MS,
      );
    }

    onStageClick(stageName);
  }, [localCurrentStatus, onStageClick]);

  const stageViewModels = useMemo(() => buildStagePipelineViewModels({
    stages: localStages,
    transitionHistory: localTransitionHistory,
    currentStatus: localCurrentStatus,
  }), [localCurrentStatus, localStages, localTransitionHistory]);

  return {
    isTransitioning,
    localTransitionHistory,
    openPopoverIdx,
    setOpenPopoverIdx,
    stageViewModels,
    handleStageClick,
  };
}

function clearTransitioningTimeout(
  ref: React.MutableRefObject<ReturnType<typeof setTimeout> | null>,
) {
  if (ref.current) {
    clearTimeout(ref.current);
    ref.current = null;
  }
}

function buildStagePipelineViewModels({
  stages,
  transitionHistory,
  currentStatus,
}: {
  stages: StagePipelineProps["stages"];
  transitionHistory: StagePipelineProps["transitionHistory"];
  currentStatus: string;
}): StagePipelineStageViewModel[] {
  const currentStageToRecords = groupTransitionRecordsByStage(transitionHistory);
  const currentStageIndex = stages?.findIndex((stage) => stage.id === currentStatus) ?? -1;

  return stages.map((stage, index) => {
    const records = currentStageToRecords[stage.id] || [];

    return {
      stage,
      index,
      records,
      isCompleted: index < currentStageIndex,
      isCurrent: currentStatus === stage.id,
      latestRecord: records.length > 0 ? records[records.length - 1] : null,
    };
  });
}
