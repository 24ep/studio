"use client";

import { InformationCircleIcon as Info } from "@heroicons/react/24/outline";

import { PopoverContent } from "@/components/ui/popover";
import type { TransitionRecord } from "@/lib/types";

import { getStagePopoverDurationText } from "./stage-pipeline-utils";

interface StagePipelinePopoverProps {
  stageName: string;
  stageId: string;
  records: TransitionRecord[];
  isCompleted: boolean;
  isCurrent: boolean;
  latestRecord: TransitionRecord | null;
  transitionHistory: TransitionRecord[];
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

export function StagePipelinePopover({
  stageName,
  stageId,
  records,
  isCompleted,
  isCurrent,
  latestRecord,
  transitionHistory,
  onMouseEnter,
  onMouseLeave,
}: StagePipelinePopoverProps) {
  return (
    <PopoverContent
      className="w-80"
      align="start"
      sideOffset={4}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="mb-1 font-semibold">{stageName}</div>
      {records.length > 0 ? (
        <ul className="space-y-2">
          {records.map((record) => (
            <StageTransitionRecordItem key={record.id} record={record} />
          ))}
        </ul>
      ) : (
        <div className="text-xs text-muted-foreground">No transition record for this stage yet.</div>
      )}

      <div className="mt-3 pt-2 border-t border-muted">
        <div className="text-xs text-muted-foreground mb-1">Duration:</div>
        <div className="text-sm">
          {getStagePopoverDurationText({
            stageId,
            isCompleted,
            isCurrent,
            latestRecord,
            transitionHistory,
          })}
        </div>
      </div>
    </PopoverContent>
  );
}

function StageTransitionRecordItem({ record }: { record: TransitionRecord }) {
  return (
    <li className="border-b pb-2 last:border-b-0 last:pb-0">
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
        <Info className="h-3 w-3" />
        <span>{record.notes || <span className="italic text-muted-foreground">No note</span>}</span>
      </div>
      <div className="flex items-center gap-2 text-xs">
        <span>By: <span className="font-medium">{record.actingUserName || "Unknown"}</span></span>
        <span className="text-muted-foreground">|</span>
        <span>{record.date ? new Date(record.date).toLocaleString() : ""}</span>
      </div>
    </li>
  );
}
