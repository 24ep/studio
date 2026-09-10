import type { TransitionRecord } from "@/lib/types";

import { getStageTimelineDurationText } from "./stage-pipeline-utils";
import type { StagePipelineStageViewModel } from "./StagePipelineTypes";

interface StageConnectorProps {
  active: boolean;
  color?: string | null;
  stageName: string;
}

export function StageConnector({
  active,
  color,
  stageName,
}: StageConnectorProps) {
  return (
    <div
      className="absolute top-4 z-0 h-full w-px"
      style={{ height: "calc(100% - 0rem)", width: "calc(2.75rem)" }}
    >
      <div
        className="mx-auto h-full w-px bg-gray-300 transition-colors duration-300"
        style={{
          background: active
            ? (isRejectStage(stageName) ? "#ef4444" : (color || "#22c55e"))
            : "#d1d5db",
        }}
      />
    </div>
  );
}

interface StageNodeIconProps {
  stageName: string;
  color?: string | null;
  isCompleted: boolean;
  isCurrent: boolean;
  isTransitioning: boolean;
}

export function StageNodeIcon({
  stageName,
  color,
  isCompleted,
  isCurrent,
  isTransitioning,
}: StageNodeIconProps) {
  return (
    <div
      className={getStageNodeClassName({ stageName, isCompleted, isCurrent })}
      style={isCompleted && !isRejectStage(stageName)
        ? { backgroundColor: color || "#22c55e", borderColor: color || "#22c55e", color: "#fff" }
        : undefined}
    >
      {isCompleted ? (
        <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      ) : isCurrent && isTransitioning ? (
        <div className="h-2 w-2 animate-spin rounded-full border border-current border-t-transparent" />
      ) : (
        <span className="block h-2 w-2 rounded-full bg-card" />
      )}
    </div>
  );
}

export function StageTimelineDuration({
  isCompleted,
  isCurrent,
  latestRecord,
  stage,
  stageIndex,
  transitionHistory,
}: {
  isCompleted: boolean;
  isCurrent: boolean;
  latestRecord: StagePipelineStageViewModel["latestRecord"];
  stage: StagePipelineStageViewModel["stage"];
  stageIndex: number;
  transitionHistory: TransitionRecord[];
}) {
  return (
    <div className="mt-0.5 text-xs text-muted-foreground">
      {getStageTimelineDurationText({
        stageId: stage.id,
        stageIndex,
        isCompleted,
        isCurrent,
        latestRecord,
        transitionHistory,
      })}
    </div>
  );
}

export function getStageButtonTitle({
  stageName,
  isCompleted,
  isCurrent,
  updateCount,
}: {
  stageName: string;
  isCompleted: boolean;
  isCurrent: boolean;
  updateCount: number;
}) {
  const state = isCompleted ? "Completed" : isCurrent ? "Current" : "Future";
  const updateText = updateCount > 0
    ? ` (${updateCount} update${updateCount > 1 ? "s" : ""})`
    : "";

  return `${stageName} - ${state} stage${updateText}`;
}

export function getStageButtonClassName({
  isCompleted,
  isCurrent,
  isTransitioning,
  stageName,
}: {
  isCompleted: boolean;
  isCurrent: boolean;
  isTransitioning: boolean;
  stageName: string;
}) {
  const baseClass = "relative z-10 flex cursor-pointer items-center gap-3 rounded-full px-3 py-2 transition-all duration-300";
  const stateClass = isCurrent
    ? "bg-secondary border-grey-900 font-bold"
    : isCompleted && isRejectStage(stageName)
      ? "bg-red-500 border-red-700 text-white font-bold shadow-red-400 shadow-lg"
      : isCompleted
        ? ""
        : "bg-gray-100 text-muted-foreground hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700";
  const transitioningClass = isCurrent && isTransitioning ? "animate-pulse" : "";

  return `${baseClass} ${stateClass} ${transitioningClass}`;
}

function getStageNodeClassName({
  stageName,
  isCompleted,
  isCurrent,
}: {
  stageName: string;
  isCompleted: boolean;
  isCurrent: boolean;
}) {
  const baseClass = "flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all duration-300";
  const stateClass = isCompleted && isRejectStage(stageName)
    ? "bg-red-500 border-red-600 text-white"
    : isCompleted
      ? ""
      : isCurrent
        ? "bg-primary border-primary text-white"
        : "bg-gray-300 border-gray-300 text-gray-500";

  return `${baseClass} ${stateClass}`;
}

function isRejectStage(stageName: string) {
  return stageName.toLowerCase().includes("reject");
}
