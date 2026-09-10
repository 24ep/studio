"use client";

import { CheckCircle, Circle, Clock, Loader2, XCircle } from "lucide-react";

import { getUploadQueueStatusIconModel } from "./applicants/applicant-import-queue-utils";

export function UploadQueueStatusIcon({ status }: { status: string }) {
  const iconModel = getUploadQueueStatusIconModel(status);

  switch (iconModel.type) {
    case "queued":
      return <Clock className={iconModel.className} />;
    case "processing":
      return <Loader2 className={iconModel.className} />;
    case "success":
      return <CheckCircle className={iconModel.className} />;
    case "failed":
      return <XCircle className={iconModel.className} />;
    default:
      return <Circle className={iconModel.className} />;
  }
}
