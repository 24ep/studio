import type { BulkUploadResultSummary, BulkUploadToastMessage } from "./bulk-upload-cvs-types";

export function getBulkUploadSuccessToast({
  successful,
  failed,
  errors,
  queuedAfterTimeout,
}: Pick<BulkUploadResultSummary, "successful" | "failed" | "errors" | "queuedAfterTimeout">): BulkUploadToastMessage {
  if (queuedAfterTimeout) {
    return {
      title: `Upload queued: ${successful} files accepted for processing`,
      description: "The server is still processing the upload response. You can follow progress in Process Queue.",
    };
  }

  if (failed === 0) {
    return {
      title: `Upload Complete: ${successful} files uploaded and queued for processing`,
    };
  }

  return {
    title: `Upload Complete: ${successful} files uploaded, ${failed} files failed`,
    description: errors.length > 0
      ? `Failed files: ${errors.join(", ")}`
      : "Some files were uploaded successfully. Check the queue for details.",
  };
}

export function getBulkUploadErrorToast(error: unknown): BulkUploadToastMessage {
  if (!(error instanceof Error)) {
    return {
      title: "Upload failed",
      description: "Please try again",
    };
  }

  if (error.message.includes("timeout") || error.message.includes("timed out")) {
    return {
      title: "Upload timed out",
      description: "The upload took too long. Please try with fewer files or smaller files.",
    };
  }

  if (error.message.includes("Network error")) {
    return {
      title: "Network error",
      description: "Please check your internet connection and try again.",
    };
  }

  if (error.message.includes("Storage service unavailable")) {
    return {
      title: "Storage service unavailable",
      description: "The file storage service is currently unavailable. Please try again later.",
    };
  }

  if (error.message.includes("Forbidden")) {
    return {
      title: "Permission denied",
      description: "You do not have permission to upload files. Please contact your administrator.",
    };
  }

  if (error.message.includes("Unauthorized")) {
    return {
      title: "Session expired",
      description: "Your session has expired. Please refresh the page and try again.",
    };
  }

  return {
    title: "Upload failed",
    description: error.message,
  };
}
