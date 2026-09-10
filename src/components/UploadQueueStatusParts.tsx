"use client";

import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getUploadQueueRealtimeStatusText } from "./applicants/applicant-import-queue-utils";

export { UploadQueueDetailsDialog } from "./UploadQueueDetailsDialog";
export { UploadQueueFilters } from "./UploadQueueStatusFilters";
export { UploadQueueItemsCard } from "./UploadQueueItemsCard";

interface UploadQueueHeaderProps {
  realtimeConnected: boolean;
}

export function UploadQueueHeader({ realtimeConnected }: UploadQueueHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Upload Queue Status</h2>
        <p className="text-muted-foreground">Monitor the status of your CV uploads in real-time</p>
      </div>
      <div className="flex items-center space-x-2">
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <span>{getUploadQueueRealtimeStatusText(realtimeConnected)}</span>
        </div>
      </div>
    </div>
  );
}

export function UploadQueueErrorAlert({ errorMessage }: { errorMessage: string | null }) {
  if (!errorMessage) {
    return null;
  }

  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>{errorMessage}</AlertDescription>
    </Alert>
  );
}
