"use client";

import {
  ClockIcon as Clock,
  InformationCircleIcon as Info,
  UsersIcon as Users,
} from "@heroicons/react/24/outline";

import { PopoverContent } from "@/components/ui/popover";
import { sanitizeHtml } from "@/lib/utils";
import type { RecruitmentPipelineStageView } from "./recruitment-pipeline-utils";

interface RecruitmentPipelineStagePopoverProps {
  onClose: () => void;
  onOpen: () => void;
  view: RecruitmentPipelineStageView;
}

export function RecruitmentPipelineStagePopover({
  onClose,
  onOpen,
  view,
}: RecruitmentPipelineStagePopoverProps) {
  return (
    <PopoverContent
      className="w-80"
      align="center"
      sideOffset={4}
      onMouseEnter={onOpen}
      onMouseLeave={onClose}
    >
      <div className="mb-3">
        <div className="font-semibold text-sm mb-1">{view.stage.name}</div>
        <div className="text-xs text-muted-foreground">{view.statusLabel}</div>
      </div>

      {view.records.length > 0 ? (
        <RecruitmentPipelineStageRecords view={view} />
      ) : (
        <RecruitmentPipelineNoRecords view={view} />
      )}

      <div className="mt-3 pt-2 border-t border-muted">
        <div className="text-xs text-muted-foreground mb-1">Duration:</div>
        <div className="text-sm">{view.durationLabel}</div>
      </div>
    </PopoverContent>
  );
}

function RecruitmentPipelineStageRecords({ view }: { view: RecruitmentPipelineStageView }) {
  return (
    <div className="space-y-3 max-h-48 overflow-y-auto custom-scrollbar">
      <div className="text-xs font-medium text-muted-foreground mb-2">Stage Updates:</div>
      {view.records.map((record) => (
        <div key={record.id} className="border-l-2 border-muted pl-3 pb-2 last:pb-0">
          <div className="text-sm mb-2">
            {record.notes ? (
              <div
                className="text-foreground prose prose-sm dark:prose-invert max-w-none [&_p]:my-0 [&_p]:inline"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(record.notes) }}
              />
            ) : (
              <div className="text-muted-foreground italic">No notes added</div>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Users className="h-3 w-3" />
            <span>Updated by: <span className="font-medium text-foreground">{record.actingUserName || "Unknown"}</span></span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
            <Clock className="h-3 w-3" />
            <span>{record.date ? new Date(record.date).toLocaleString() : "Unknown time"}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function RecruitmentPipelineNoRecords({ view }: { view: RecruitmentPipelineStageView }) {
  return (
    <div className="text-sm text-muted-foreground py-2">
      <div className="flex items-center gap-2 mb-1">
        <Info className="h-4 w-4" />
        <span>{view.isSkipped ? "This stage was skipped" : "No updates recorded for this stage"}</span>
      </div>
      {view.isActuallyCompleted && (
        <div className="text-xs text-muted-foreground">
          This stage was completed but no notes were added.
        </div>
      )}
      {!view.isReached && !view.isCurrent && (
        <div className="text-xs text-muted-foreground">
          This stage has not been reached yet.
        </div>
      )}
    </div>
  );
}
