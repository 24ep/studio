"use client";

import {
  CheckCircleIcon as CheckCircle,
  XMarkIcon as X,
} from "@heroicons/react/24/outline";

import { Popover, PopoverTrigger } from "@/components/ui/popover";
import type { RecruitmentPipelineStageView } from "./recruitment-pipeline-utils";
import { RecruitmentPipelineStagePopover } from "./RecruitmentPipelineStagePopover";

interface RecruitmentPipelineStageNodeProps {
  isOpen: boolean;
  isTransitioning: boolean;
  onClose: () => void;
  onOpen: () => void;
  onStageClick: (stageId: string) => void;
  view: RecruitmentPipelineStageView;
}

export function RecruitmentPipelineStageNode({
  isOpen,
  isTransitioning,
  onClose,
  onOpen,
  onStageClick,
  view,
}: RecruitmentPipelineStageNodeProps) {
  const { stage } = view;

  return (
    <div className="flex items-center">
      <div
        className={`relative flex flex-col items-center cursor-pointer hover:bg-muted/30 rounded-lg p-1 transition-colors ${view.isSkipped ? "opacity-60" : ""}`}
        onClick={() => {
          if (!view.isActuallyCompleted) {
            onStageClick(stage.id);
          }
        }}
        title={view.title}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            event.currentTarget.click();
          }
        }}
      >
        <Popover open={isOpen}>
          <PopoverTrigger asChild>
            <div
              className={`
                w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold z-10 transition-all duration-300 cursor-pointer
                ${view.isSkipped ? "bg-gray-400 text-gray-600" : ""}
                ${view.isActuallyCompleted ? "bg-green-500 text-white" : ""}
                ${view.isFuture ? "bg-muted text-muted-foreground" : ""}
                ${view.isCurrent && isTransitioning ? "animate-pulse" : ""}
              `}
              style={getStageNodeStyle(view)}
              onMouseEnter={onOpen}
              onMouseLeave={onClose}
            >
              <RecruitmentPipelineStageIcon
                index={view.index}
                isActuallyCompleted={view.isActuallyCompleted}
                isCurrent={view.isCurrent}
                isSkipped={view.isSkipped}
                isTransitioning={isTransitioning}
              />
            </div>
          </PopoverTrigger>
          <RecruitmentPipelineStagePopover
            onClose={onClose}
            onOpen={onOpen}
            view={view}
          />
        </Popover>

        <div className="mt-2 text-center w-full">
          <div className="flex items-center gap-1 justify-center">
            <h4 className={`text-xs font-medium ${view.isCurrent ? "text-primary" : view.isSkipped ? "text-gray-400" : "text-foreground"} truncate max-w-[100px]`}>
              {stage.name}
            </h4>
            {view.isCurrent && isTransitioning && (
              <div className="w-2 h-2 border border-current border-t-transparent rounded-full animate-spin" />
            )}
          </div>
          <div className="text-xs text-muted-foreground mt-1 min-h-[1rem]">
            {view.durationLabel}
          </div>
        </div>
      </div>
    </div>
  );
}

function RecruitmentPipelineStageIcon({
  index,
  isActuallyCompleted,
  isCurrent,
  isSkipped,
  isTransitioning,
}: {
  index: number;
  isActuallyCompleted: boolean;
  isCurrent: boolean;
  isSkipped: boolean;
  isTransitioning: boolean;
}) {
  if (isCurrent) {
    return (
      <div className="w-4 h-4 flex items-center justify-center">
        {isTransitioning ? (
          <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : (
          <div className="w-2 h-2 bg-current rounded-full" />
        )}
      </div>
    );
  }

  if (isActuallyCompleted) {
    return <CheckCircle className="w-4 h-4" />;
  }

  if (isSkipped) {
    return <X className="w-4 h-4 text-gray-500" />;
  }

  return <>{index + 1}</>;
}

function getStageNodeStyle(view: RecruitmentPipelineStageView) {
  if (view.isSkipped) {
    return { backgroundColor: "#9ca3af", color: "#6b7280" };
  }

  if (view.isCurrent) {
    return {
      backgroundColor: `${view.stage.color_complete || "#22c55e"}80`,
      color: "#fff",
    };
  }

  if (view.isActuallyCompleted && !view.stage.name.toLowerCase().includes("reject")) {
    return { backgroundColor: view.stage.color_complete || "#22c55e", color: "#fff" };
  }

  return undefined;
}
