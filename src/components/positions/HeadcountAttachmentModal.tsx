"use client";

import type { Headcount } from '@/lib/types';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileViewerModal } from '@/components/ui/file-viewer-modal';
import {
  HeadcountAttachmentList,
  HeadcountAttachmentUploadSection,
} from './HeadcountAttachmentModalParts';
import { useHeadcountAttachmentModal } from './use-headcount-attachment-modal';

interface HeadcountAttachmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  headcount: Headcount | null;
  onClose: () => void;
  onUpdate: () => void;
}

export function HeadcountAttachmentModal({
  open,
  onOpenChange,
  headcount,
  onClose,
  onUpdate,
}: HeadcountAttachmentModalProps) {
  const controller = useHeadcountAttachmentModal({
    headcount,
    onUpdate,
  });

  if (!headcount) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dialogId="headcount-attachment-modal">
          <DialogHeader>
            <DialogTitle>Manage Attachments</DialogTitle>
            <DialogDescription>
              Upload and manage files for headcount: {headcount.type} - {headcount.status}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <HeadcountAttachmentUploadSection
              fileInputRef={controller.fileInputRef}
              selectedFiles={controller.selectedFiles}
              uploading={controller.uploading}
              onFileSelect={controller.handleFileSelect}
              onFilePreview={controller.handleFilePreview}
              onFileRemove={controller.handleRemoveFile}
              onUpload={controller.handleFileUpload}
            />

            <HeadcountAttachmentList
              attachments={headcount.attachments}
              deleting={controller.deleting}
              onPreview={controller.handleAttachmentPreview}
              onDownload={controller.handleDownload}
              onDelete={controller.handleDeleteAttachment}
            />

            <div className="flex justify-end">
              <Button onClick={onClose}>Close</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <FileViewerModal
        isOpen={controller.fileViewerOpen}
        onOpenChange={controller.setFileViewerOpen}
        file={controller.fileViewerFile}
      />
    </>
  );
}
