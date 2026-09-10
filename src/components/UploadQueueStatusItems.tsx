"use client";

import { Info } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { SkeletonCard } from "@/components/ui/loading-overlay";

import {
  formatUploadQueueDate,
  getUploadQueueItemAnimationDelay,
  getUploadQueueProcessedApplicantsText,
  getUploadQueueSourceLine,
  getUploadQueueStatusColor,
  getUploadQueueStatusDisplayText,
  UPLOAD_QUEUE_LOADING_SKELETON_COUNT,
} from "./applicants/applicant-import-queue-utils";
import type { QueueItem, QueueResponse } from "./applicants/applicant-import-queue-types";
import { UploadQueueStatusIcon } from "./UploadQueueStatusIcon";

interface UploadQueueItemsProps {
  queueData: QueueResponse | null;
  loading: boolean;
  onItemClick: (item: QueueItem) => void;
}

export function UploadQueueItems({
  queueData,
  loading,
  onItemClick,
}: UploadQueueItemsProps) {
  if (loading) {
    return (
      <div className="space-y-4 stagger-fade-in">
        {Array.from({ length: UPLOAD_QUEUE_LOADING_SKELETON_COUNT }).map((_, index) => (
          <SkeletonCard key={`skeleton-${index}`} />
        ))}
      </div>
    );
  }

  if (!queueData?.data || queueData.data.length === 0) {
    return (
      <div className="text-center py-8">
        <Info className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">No queue items found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 stagger-fade-in">
      {queueData.data.map((item, index) => (
        <UploadQueueItemCard
          key={item.id}
          item={item}
          animationDelayMs={getUploadQueueItemAnimationDelay(index)}
          onClick={onItemClick}
        />
      ))}
    </div>
  );
}

interface UploadQueueItemCardProps {
  item: QueueItem;
  animationDelayMs: number;
  onClick: (item: QueueItem) => void;
}

function UploadQueueItemCard({ item, animationDelayMs, onClick }: UploadQueueItemCardProps) {
  const sourceLine = getUploadQueueSourceLine(item);
  const processedApplicantsText = getUploadQueueProcessedApplicantsText(item);

  return (
    <div
      className="border rounded-lg p-4 hover:bg-muted/50 cursor-pointer transition-colors content-fade-in"
      style={{ animationDelay: `${animationDelayMs}ms` }}
      onClick={() => onClick(item)}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick(item);
        }
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <UploadQueueStatusIcon status={item.status} />
          <div>
            <h3 className="font-medium">{item.file_name}</h3>
            <p className="text-sm text-muted-foreground">
              Uploaded: {formatUploadQueueDate(item.upload_date)}
            </p>
            {sourceLine && (
              <p className="text-xs text-muted-foreground">
                {sourceLine}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge className={getUploadQueueStatusColor(item.status)}>
            {getUploadQueueStatusDisplayText(item.status)}
          </Badge>
          {item.progress !== undefined && (
            <span className="text-sm text-muted-foreground">{item.progress}%</span>
          )}
        </div>
      </div>

      {item.error && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
          <strong>Error:</strong> {item.error}
        </div>
      )}

      {processedApplicantsText && (
        <div className="mt-2 text-sm text-muted-foreground">
          {processedApplicantsText}
        </div>
      )}
    </div>
  );
}
