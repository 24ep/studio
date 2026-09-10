"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import type { ApplicantCommentChannel } from "./applicant-comments-utils";

interface ApplicantCommentChannelSelectProps {
  selectedChannel: ApplicantCommentChannel;
  onChannelChange: (channel: ApplicantCommentChannel) => void;
  canViewAllComments: boolean;
  canViewRemarksOnly: boolean;
  canViewActivities: boolean;
}

export function ApplicantCommentChannelSelect({
  selectedChannel,
  onChannelChange,
  canViewAllComments,
  canViewRemarksOnly,
  canViewActivities,
}: ApplicantCommentChannelSelectProps) {
  return (
    <div className="mb-2 flex items-center gap-2">
      <span className="text-[11px] font-medium text-muted-foreground">Post as:</span>
      <Select value={selectedChannel} onValueChange={(value) => onChannelChange(value as ApplicantCommentChannel)}>
        <SelectTrigger className="h-7 w-auto min-w-[82px] !rounded-full border-0 bg-blue-50 px-3 py-0 text-[11px] font-semibold text-blue-700 shadow-none transition-colors hover:bg-blue-100 focus-visible:ring-1 focus-visible:ring-blue-300 focus-visible:ring-offset-0 dark:bg-blue-950/60 dark:text-blue-300 dark:hover:bg-blue-950 [&>svg]:text-blue-600 [&>svg]:opacity-100 dark:[&>svg]:text-blue-300">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {canViewAllComments && (
            <SelectItem value="comment" className="text-[11px]">Comment</SelectItem>
          )}
          {(canViewAllComments || canViewRemarksOnly) && (
            <SelectItem value="remark" className="text-[11px]">Remark to HM</SelectItem>
          )}
          {canViewActivities && (
            <SelectItem value="activity" className="text-[11px]">Activity</SelectItem>
          )}
        </SelectContent>
      </Select>
    </div>
  );
}
