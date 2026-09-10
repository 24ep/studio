"use client";

import { StagePipelineNode } from "./StagePipelineParts";
import type { StagePipelineProps } from "./StagePipelineTypes";
import { useStagePipeline } from "./use-stage-pipeline";

export function StagePipeline({
  stages,
  transitionHistory,
  currentStatus,
  onStageClick,
}: StagePipelineProps) {
  const pipeline = useStagePipeline({
    stages,
    transitionHistory,
    currentStatus,
    onStageClick,
  });

  return (
    <div className="flex flex-col gap-0.5 mb-6 relative">
      {pipeline.stageViewModels.map((viewModel, index) => (
        <StagePipelineNode
          key={viewModel.stage.id}
          viewModel={viewModel}
          isLast={index === pipeline.stageViewModels.length - 1}
          isTransitioning={pipeline.isTransitioning}
          transitionHistory={pipeline.localTransitionHistory}
          popoverOpen={pipeline.openPopoverIdx === index}
          onPopoverOpenChange={(open) => pipeline.setOpenPopoverIdx(open ? index : null)}
          onStageClick={pipeline.handleStageClick}
        />
      ))}
    </div>
  );
}
