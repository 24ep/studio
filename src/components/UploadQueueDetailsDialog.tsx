"use client";

import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

import {
  formatUploadQueueDate,
  getUploadQueueApplicantProgressText,
  getUploadQueueProgressText,
  getUploadQueueStatusColor,
  getUploadQueueStatusDisplayText,
} from "./applicants/applicant-import-queue-utils";
import type { QueueItem } from "./applicants/applicant-import-queue-types";
import { UploadQueueStatusIcon } from "./UploadQueueStatusIcon";

interface UploadQueueDetailsDialogProps {
  item: QueueItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UploadQueueDetailsDialog({
  item,
  open,
  onOpenChange,
}: UploadQueueDetailsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        placement="right"
        className="sm:max-w-lg"
        dialogId="upload-queue-details-drawer"
      >
        <DialogHeader className="border-b border-border/70 px-5 py-5 sm:px-6">
          <DialogTitle>Queue item details</DialogTitle>
          <DialogDescription>
            Review processing status, progress, ownership, and errors without leaving the queue.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">
          {item ? (
            <div className="space-y-6">
              <UploadQueueDetailGrid item={item} />
              <UploadQueueProgress item={item} />
              <UploadQueueApplicantProgress item={item} />
              <UploadQueueError item={item} />
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function UploadQueueDetailGrid({ item }: { item: QueueItem }) {
  return (
    <div className="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2">
      <div className="min-w-0">
        <Label className="text-xs font-medium text-muted-foreground">File name</Label>
        <p className="mt-1 break-words text-sm font-medium text-foreground">{item.file_name}</p>
      </div>
      <div>
        <Label className="text-xs font-medium text-muted-foreground">Status</Label>
        <div className="mt-1 flex items-center gap-2">
          <UploadQueueStatusIcon status={item.status} />
          <Badge className={getUploadQueueStatusColor(item.status)}>
            {getUploadQueueStatusDisplayText(item.status)}
          </Badge>
        </div>
      </div>
      <div>
        <Label className="text-xs font-medium text-muted-foreground">Upload date</Label>
        <p className="mt-1 text-sm">{formatUploadQueueDate(item.upload_date)}</p>
      </div>
      {item.process_date ? (
        <div>
          <Label className="text-xs font-medium text-muted-foreground">Process date</Label>
          <p className="mt-1 text-sm">{formatUploadQueueDate(item.process_date)}</p>
        </div>
      ) : null}
      {item.completed_date ? (
        <div>
          <Label className="text-xs font-medium text-muted-foreground">Completed date</Label>
          <p className="mt-1 text-sm">{formatUploadQueueDate(item.completed_date)}</p>
        </div>
      ) : null}
      {item.user_email ? (
        <div className="min-w-0">
          <Label className="text-xs font-medium text-muted-foreground">Uploaded by</Label>
          <p className="mt-1 break-words text-sm">{item.user_email}</p>
        </div>
      ) : null}
    </div>
  );
}

function UploadQueueProgress({ item }: { item: QueueItem }) {
  if (item.progress === undefined) {
    return null;
  }

  return (
    <section className="border-t border-border/70 pt-5">
      <Label className="text-sm font-medium">Progress</Label>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-2 rounded-full bg-primary transition-all duration-300"
          style={{ width: `${item.progress}%` }}
        />
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        {getUploadQueueProgressText(item.progress)}
      </p>
    </section>
  );
}

function UploadQueueApplicantProgress({ item }: { item: QueueItem }) {
  if (item.processed_applicants === undefined || item.total_applicants === undefined) {
    return null;
  }

  return (
    <section className="border-t border-border/70 pt-5">
      <Label className="text-sm font-medium">Applicants processed</Label>
      <p className="mt-1 text-sm text-muted-foreground">
        {getUploadQueueApplicantProgressText(item)}
      </p>
    </section>
  );
}

function UploadQueueError({ item }: { item: QueueItem }) {
  if (!item.error) {
    return null;
  }

  return (
    <section className="border-t border-border/70 pt-5">
      <Label className="text-sm font-medium text-destructive">Error</Label>
      <p className="mt-1 text-sm text-destructive">{item.error}</p>
      {item.error_details ? (
        <div className="mt-3">
          <Label className="text-xs font-medium text-destructive">Error details</Label>
          <pre className="mt-1.5 max-h-72 overflow-auto rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-xs leading-5 text-destructive">
            {item.error_details}
          </pre>
        </div>
      ) : null}
    </section>
  );
}
