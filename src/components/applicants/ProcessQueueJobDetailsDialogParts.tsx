import { PhotoIcon as ImageIcon } from "@heroicons/react/24/outline";

import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { formatFileSize } from "@/lib/utils";

import type { ProcessQueueAnalyticsData } from "./process-queue-analytics-utils";

type ProcessQueueJob = ProcessQueueAnalyticsData["scatterData"][number];

function getStatusColor(status: string) {
  switch (status.toLowerCase()) {
    case "success":
      return "text-green-600";
    case "fail":
    case "failed":
    case "error":
      return "text-red-600";
    case "inprocess":
      return "text-yellow-600";
    case "queued":
      return "text-blue-600";
    default:
      return "text-gray-600";
  }
}

function formatNullableDate(value: string | null, fallback: string) {
  return value ? new Date(value).toLocaleString() : fallback;
}

export function ProcessQueueJobDetailsContent({ job }: { job: ProcessQueueJob }) {
  return (
    <div className="space-y-6">
      <ProcessQueueJobSummary job={job} />
      <ProcessQueueFileInfo job={job} />
      <ProcessQueueTimingInfo job={job} />
      {(job.positionTitle || job.source) && <ProcessQueueAdditionalInfo job={job} />}
      {job.error && <ProcessQueueErrorInfo job={job} />}
    </div>
  );
}

function ProcessQueueJobSummary({ job }: { job: ProcessQueueJob }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <Label className="text-sm font-medium text-muted-foreground">Job ID</Label>
        <p className="text-sm">{job.id}</p>
      </div>
      <div>
        <Label className="text-sm font-medium text-muted-foreground">Status</Label>
        <Badge className={getStatusColor(job.status)}>
          {job.status}
        </Badge>
      </div>
    </div>
  );
}

function ProcessQueueFileInfo({ job }: { job: ProcessQueueJob }) {
  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium text-muted-foreground">File Information</Label>
      <div className="grid grid-cols-2 gap-4 rounded-lg border p-3">
        <div>
          <p className="text-sm font-medium">File Name</p>
          <p className="text-sm text-muted-foreground">{job.fileName}</p>
        </div>
        <div>
          <p className="text-sm font-medium">File Size</p>
          <p className="text-sm text-muted-foreground">{formatFileSize(job.fileSize)}</p>
        </div>
      </div>
    </div>
  );
}

function ProcessQueueTimingInfo({ job }: { job: ProcessQueueJob }) {
  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium text-muted-foreground">Timing Information</Label>
      <div className="grid grid-cols-2 gap-4 rounded-lg border p-3">
        <div>
          <p className="text-sm font-medium">Upload Date</p>
          <p className="text-sm text-muted-foreground">{new Date(job.uploadDate).toLocaleString()}</p>
        </div>
        <div>
          <p className="text-sm font-medium">Process Date</p>
          <p className="text-sm text-muted-foreground">{formatNullableDate(job.processDate, "Not started")}</p>
        </div>
        <div>
          <p className="text-sm font-medium">Completed Date</p>
          <p className="text-sm text-muted-foreground">{formatNullableDate(job.completedDate, "Not completed")}</p>
        </div>
        <div>
          <p className="text-sm font-medium">Duration</p>
          <p className="text-sm text-muted-foreground">{job.y.toFixed(2)} minutes</p>
        </div>
      </div>
    </div>
  );
}

function ProcessQueueAdditionalInfo({ job }: { job: ProcessQueueJob }) {
  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium text-muted-foreground">Additional Information</Label>
      <div className="grid grid-cols-2 gap-4 rounded-lg border p-3">
        {job.positionTitle && (
          <div>
            <p className="text-sm font-medium">Position Title</p>
            <p className="text-sm text-muted-foreground">{job.positionTitle}</p>
          </div>
        )}
        {job.source && (
          <div>
            <p className="text-sm font-medium">Source</p>
            <div className="flex items-center gap-2">
              {job.source_logo ? (
                <img
                  src={job.source_logo}
                  alt={`${job.source} logo`}
                  className="h-4 w-4 flex-shrink-0 rounded-full object-contain"
                />
              ) : (
                <div className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-muted">
                  <ImageIcon className="h-2 w-2 text-muted-foreground" />
                </div>
              )}
              <p className="text-sm text-muted-foreground">{job.source}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ProcessQueueErrorInfo({ job }: { job: ProcessQueueJob }) {
  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium text-muted-foreground">Error Information</Label>
      <div className="rounded-lg border border-red-200 bg-red-50 p-3">
        <div>
          <p className="text-sm font-medium text-red-800">Error</p>
          <p className="text-sm text-red-700">{job.error}</p>
        </div>
        {job.errorDetails && (
          <div className="mt-2">
            <p className="text-sm font-medium text-red-800">Error Details</p>
            <p className="text-sm text-red-700">{job.errorDetails}</p>
          </div>
        )}
      </div>
    </div>
  );
}
