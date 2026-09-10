"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import { ProcessQueueJobDetailsContent } from "./ProcessQueueJobDetailsDialogParts";
import type { ProcessQueueAnalyticsData } from "./process-queue-analytics-utils";

type ProcessQueueJob = ProcessQueueAnalyticsData["scatterData"][number];

interface ProcessQueueJobDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job: ProcessQueueJob | null;
}

export function ProcessQueueJobDetailsDialog({
  open,
  onOpenChange,
  job,
}: ProcessQueueJobDetailsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Job Details</DialogTitle>
          <DialogDescription>
            Detailed information about the selected process job
          </DialogDescription>
        </DialogHeader>
        {job && <ProcessQueueJobDetailsContent job={job} />}
      </DialogContent>
    </Dialog>
  );
}
