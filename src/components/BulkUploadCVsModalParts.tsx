"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DialogClose } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Loader2, Trash2, UploadCloud } from "lucide-react";

import {
  buildBulkUploadViewerFile,
  getBulkUploadFileBatchLabel,
  getBulkUploadFileListItemClassName,
  getBulkUploadProgressBarWidth,
  getBulkUploadProgressCountLabel,
  getBulkUploadProgressLabel,
  getBulkUploadSelectedFilesLabel,
  getBulkUploadSubmitButtonText,
  isBulkUploadSubmitDisabled,
} from "./bulk-upload-cvs-utils";
import type { BulkUploadViewerFile } from "./bulk-upload-cvs-utils";

interface BulkUploadAccessDeniedDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

interface BulkUploadFileListProps {
  selectedFiles: File[];
  selectedFileIndex: number;
  fileBatchMap: Record<string, string>;
  previewUrl: string | null;
  onSelectedFileIndexChange: (index: number) => void;
  onViewerFileChange: (file: BulkUploadViewerFile) => void;
  onViewerOpenChange: (open: boolean) => void;
  onRemoveFile: (file: File) => void;
}

interface BulkUploadProgressProps {
  totalFiles: number;
  uploadProgress: { current: number; total: number } | null;
}

interface BulkUploadFooterProps {
  totalFiles: number;
  uploading: boolean;
  onCancelUpload: () => void;
  onConfirmUpload: (event: React.MouseEvent) => void;
  embedded?: boolean;
  onClose?: () => void;
}

export function BulkUploadAccessDeniedDialog({
  isOpen,
  onOpenChange,
}: BulkUploadAccessDeniedDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Access denied</DialogTitle>
          <DialogDescription>
            You don&apos;t have permission to perform bulk uploads. Please contact your administrator.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function BulkUploadFileList({
  selectedFiles,
  selectedFileIndex,
  fileBatchMap,
  previewUrl,
  onSelectedFileIndexChange,
  onViewerFileChange,
  onViewerOpenChange,
  onRemoveFile,
}: BulkUploadFileListProps) {
  return (
    <aside className="border-t bg-muted/20 p-4 lg:border-l lg:border-t-0">
      <Label>{getBulkUploadSelectedFilesLabel(selectedFiles.length)}</Label>
      <div className="mt-3 max-h-[420px] space-y-2 overflow-y-auto pr-1">
        {selectedFiles.map((file, index) => (
          <div
            key={index}
            className={getBulkUploadFileListItemClassName(index === selectedFileIndex)}
            onClick={() => {
              onSelectedFileIndexChange(index);
              onViewerFileChange(buildBulkUploadViewerFile(file, previewUrl || URL.createObjectURL(file)));
              onViewerOpenChange(true);
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                event.currentTarget.click();
              }
            }}
          >
            <div className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">{file.name}</span>
              <span className="text-xs text-muted-foreground">
                {getBulkUploadFileBatchLabel(fileBatchMap[file.name])}
              </span>
            </div>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={(event) => {
                event.stopPropagation();
                onRemoveFile(file);
              }}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        ))}
      </div>
    </aside>
  );
}

export function BulkUploadProgress({
  totalFiles,
  uploadProgress,
}: BulkUploadProgressProps) {
  return (
    <div className="rounded-lg border bg-muted/20 px-4 py-3">
      <div className="flex items-center justify-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm font-medium">
          {getBulkUploadProgressLabel(totalFiles)}
          {uploadProgress ? (
            <span className="ml-2 text-xs text-muted-foreground">
              {getBulkUploadProgressCountLabel(uploadProgress)}
            </span>
          ) : null}
        </span>
      </div>
      {uploadProgress ? (
        <div className="mt-2 h-2 w-full rounded-full bg-background">
          <div
            className="h-2 rounded-full bg-primary transition-all duration-300"
            style={{ width: getBulkUploadProgressBarWidth(uploadProgress) }}
          />
        </div>
      ) : null}
    </div>
  );
}

export function BulkUploadFooter({
  totalFiles,
  uploading,
  onCancelUpload,
  onConfirmUpload,
  embedded = false,
  onClose,
}: BulkUploadFooterProps) {
  const cancelButton = uploading ? (
    <Button type="button" variant="outline" onClick={onCancelUpload}>
      Cancel upload
    </Button>
  ) : embedded ? (
    <Button type="button" variant="outline" onClick={onClose}>
      Back to queue
    </Button>
  ) : (
    <DialogClose asChild>
      <Button type="button" variant="outline">
        Cancel
      </Button>
    </DialogClose>
  );

  return (
    <DialogFooter className={embedded ? "border-t border-border/70 bg-background px-5 py-4 sm:px-6" : undefined}>
      {cancelButton}
      <Button
        type="button"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onConfirmUpload(event);
        }}
        disabled={isBulkUploadSubmitDisabled(totalFiles, uploading)}
      >
        {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
        {getBulkUploadSubmitButtonText(uploading, totalFiles)}
      </Button>
    </DialogFooter>
  );
}
