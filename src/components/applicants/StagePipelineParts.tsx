"use client";

import { Popover, PopoverTrigger } from "@/components/ui/popover";
import type { TransitionRecord } from "@/lib/types";

import {
  getStageButtonClassName,
  getStageButtonTitle,
  StageConnector,
  StageNodeIcon,
  StageTimelineDuration,
} from "./StagePipelineNodeParts";
import { StagePipelinePopover } from "./StagePipelinePopover";
import type { StagePipelineStageViewModel } from "./StagePipelineTypes";

interface StagePipelineNodeProps {
  viewModel: StagePipelineStageViewModel;
  isLast: boolean;
  isTransitioning: boolean;
  transitionHistory: TransitionRecord[];
  popoverOpen: boolean;
  onPopoverOpenChange: (open: boolean) => void;
  onStageClick: (stageId: string) => void;
}

export function StagePipelineNode({
  viewModel,
  isLast,
  isTransitioning,
  transitionHistory,
  popoverOpen,
  onPopoverOpenChange,
  onStageClick,
}: StagePipelineNodeProps) {
  const { stage, index, records, isCompleted, isCurrent, latestRecord } = viewModel;

  return (
    <div className="relative flex items-start">
      {!isLast && <StageConnector stageName={stage.name} color={stage.color_complete} active={isCompleted} />}
      <Popover open={popoverOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={getStageButtonClassName({
              isCompleted,
              isCurrent,
              isTransitioning,
              stageName: stage.name,
            })}
            onClick={() => {
              if (!isCompleted) {
                onStageClick(stage.id);
              }
            }}
            title={getStageButtonTitle({
              stageName: stage.name,
              isCompleted,
              isCurrent,
              updateCount: records.length,
            })}
          >
            <StageNodeIcon
              stageName={stage.name}
              color={stage.color_complete}
              isCompleted={isCompleted}
              isCurrent={isCurrent}
              isTransitioning={isTransitioning}
            />
            <div className="flex flex-col">
              <span className="transition-all duration-300">{stage.name}</span>
              <StageTimelineDuration
                stage={stage}
                stageIndex={index}
                isCompleted={isCompleted}
                isCurrent={isCurrent}
                latestRecord={latestRecord}
                transitionHistory={transitionHistory}
              />
            </div>
            {isCurrent && isTransitioning && (
              <div className="w-2 h-2 border border-current border-t-transparent rounded-full animate-spin" />
            )}
          </button>
        </PopoverTrigger>
        <StagePipelinePopover
          stageName={stage.name}
          stageId={stage.id}
          records={records}
          isCompleted={isCompleted}
          isCurrent={isCurrent}
          latestRecord={latestRecord}
          transitionHistory={transitionHistory}
          onMouseEnter={() => onPopoverOpenChange(true)}
          onMouseLeave={() => onPopoverOpenChange(false)}
        />
      </Popover>
    </div>
  );
}
