import type { BulkUploadLayoutClasses } from "./bulk-upload-cvs-types";

export function getBulkUploadProgressPercent(progress: { current: number; total: number } | null) {
  if (!progress || progress.total <= 0) {
    return 0;
  }

  return (progress.current / progress.total) * 100;
}

export function getBulkUploadProgressBarWidth(progress: { current: number; total: number } | null) {
  return `${getBulkUploadProgressPercent(progress)}%`;
}

export function shouldShowBulkUploadFileList(totalFiles: number) {
  return totalFiles > 0;
}

export function shouldShowBulkUploadProgress(uploading: boolean) {
  return uploading;
}

export function getBulkUploadLayoutClasses(totalFiles: number): BulkUploadLayoutClasses {
  return shouldShowBulkUploadFileList(totalFiles)
    ? {
      gridClassName: "grid overflow-hidden rounded-lg border bg-background lg:grid-cols-[minmax(0,1fr)_340px]",
      uploadAreaClassName: "p-4",
    }
    : {
      gridClassName: "grid gap-6 grid-cols-1",
      uploadAreaClassName: "col-span-1",
    };
}

export function getBulkUploadSelectedFilesLabel(totalFiles: number) {
  return `Selected Files (${totalFiles})`;
}

export function getBulkUploadFileListItemClassName(isSelected: boolean) {
  const selectionClass = isSelected
    ? "border-primary bg-primary/5"
    : "border-border hover:border-primary/50";

  return `flex items-center justify-between bg-background rounded px-3 py-2 border cursor-pointer transition-colors ${selectionClass}`;
}

export function getBulkUploadFileBatchLabel(batchId?: string) {
  return `ID: ${batchId || ""}`;
}

export function getBulkUploadProgressLabel(totalFiles: number) {
  return `Uploading ${totalFiles} files...`;
}

export function getBulkUploadProgressCountLabel(progress: { current: number; total: number } | null) {
  return progress ? `(${progress.current}/${progress.total})` : null;
}

export function getBulkUploadSubmitButtonText(uploading: boolean, totalFiles: number) {
  return uploading ? "Uploading..." : `Upload ${totalFiles} files`;
}

export function isBulkUploadSubmitDisabled(totalFiles: number, uploading: boolean) {
  return totalFiles === 0 || uploading;
}
