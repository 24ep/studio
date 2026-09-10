"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { RecruitmentStage, TransitionRecord } from "@/lib/types";
import {
  buildRecruitmentPipelineStages,
  getRecruitmentPipelineLineGradient,
  groupRecruitmentTransitionsByStage,
} from "./recruitment-pipeline-utils";

interface UseRecruitmentPipelineCardOptions {
  currentStatus: string;
  onStageClick: (stageName: string) => void;
  stages: RecruitmentStage[];
  transitionHistory: TransitionRecord[];
}

export function useRecruitmentPipelineCard({
  currentStatus,
  onStageClick,
  stages,
  transitionHistory,
}: UseRecruitmentPipelineCardOptions) {
  const [openPopoverIdx, setOpenPopoverIdx] = useState<number | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const transitioningTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const safeStages = useMemo(
    () => Array.isArray(stages) ? stages : [],
    [stages]
  );
  const safeTransitionHistory = useMemo(
    () => Array.isArray(transitionHistory) ? transitionHistory : [],
    [transitionHistory]
  );
  const stageToRecords = useMemo(
    () => groupRecruitmentTransitionsByStage(safeTransitionHistory),
    [safeTransitionHistory]
  );
  const { currentStageIndex, stageViews } = useMemo(
    () => buildRecruitmentPipelineStages({
      currentStatus,
      stages: safeStages,
      stageToRecords,
      transitionHistory: safeTransitionHistory,
    }),
    [currentStatus, safeStages, safeTransitionHistory, stageToRecords]
  );
  const lineGradient = useMemo(
    () => getRecruitmentPipelineLineGradient({
      currentStageIndex,
      stages: safeStages,
      stageToRecords,
    }),
    [currentStageIndex, safeStages, stageToRecords]
  );

  useEffect(() => {
    setIsTransitioning(false);
  }, [currentStatus]);

  useEffect(() => {
    return () => {
      if (transitioningTimeoutRef.current) {
        clearTimeout(transitioningTimeoutRef.current);
      }
    };
  }, []);

  const handleStageClick = useCallback((stageId: string) => {
    if (stageId !== currentStatus) {
      setIsTransitioning(true);

      if (transitioningTimeoutRef.current) {
        clearTimeout(transitioningTimeoutRef.current);
      }

      transitioningTimeoutRef.current = setTimeout(() => setIsTransitioning(false), 5000);
    }

    onStageClick(stageId);
  }, [currentStatus, onStageClick]);

  return {
    handleStageClick,
    isTransitioning,
    lineGradient,
    openPopoverIdx,
    setOpenPopoverIdx,
    stageViews,
  };
}
