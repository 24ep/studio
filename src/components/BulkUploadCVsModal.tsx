"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { FileViewerModal } from "@/components/ui/file-viewer-modal";
import { useBulkUploadCvsModal } from './use-bulk-upload-cvs-modal';
import {
  BulkUploadMainContent,
  BulkUploadSelectionFields,
} from './BulkUploadCVsModalForm';
import {
  BulkUploadAccessDeniedDialog,
  BulkUploadFooter,
  BulkUploadProgress,
} from './BulkUploadCVsModalParts';
import {
  getBulkUploadLayoutClasses,
  shouldShowBulkUploadProgress,
} from './bulk-upload-cvs-utils';

interface BulkUploadCVsModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onUploadSuccess?: () => void;
  initialSourceName?: string;
  lockSource?: boolean;
  presentation?: 'dialog' | 'drawer' | 'page';
}

function BulkUploadCVsModal({
  isOpen,
  onOpenChange,
  onUploadSuccess,
  initialSourceName,
  lockSource = false,
  presentation = 'drawer',
}: BulkUploadCVsModalProps) {
  const {
    availableSources,
    canBulkUpload,
    dragActive,
    fileBatchMap,
    fileViewerFile,
    fileViewerOpen,
    handleConfirmUpload,
    handleDragActiveChange,
    handleFiles,
    handleModalClose,
    handlePositionChange,
    modalContentRef,
    previewUrl,
    removeFile,
    selectedFileIndex,
    selectedFiles,
    selectedPositionIds,
    selectedSourceId,
    setFileViewerFile,
    setFileViewerOpen,
    setSelectedFileIndex,
    setSelectedSourceId,
    setSubSource,
    subSource,
    uploadProgress,
    uploading,
    cancelUpload,
  } = useBulkUploadCvsModal({
    isOpen,
    onOpenChange,
    onUploadSuccess,
    initialSourceName,
  });

  if (!canBulkUpload) {
    return (
      <BulkUploadAccessDeniedDialog
        isOpen={isOpen}
        onOpenChange={onOpenChange}
      />
    );
  }

  if (!isOpen) {
    return null;
  }

  const totalFiles = selectedFiles.length;
  const layoutClasses = getBulkUploadLayoutClasses(totalFiles);
  const title = initialSourceName ? 'Upload CV' : 'Add resumes';
  const description = initialSourceName
    ? 'Upload your friend\'s CV and optionally assign it to an open position.'
    : 'Upload multiple resumes, set their source, and optionally assign them to open positions.';

  const workflowBody = (
    <>
      <BulkUploadSelectionFields
        availableSources={availableSources}
        selectedPositionIds={selectedPositionIds}
        selectedSourceId={selectedSourceId}
        subSource={subSource}
        uploading={uploading}
        onPositionChange={handlePositionChange}
        onSourceChange={setSelectedSourceId}
        onSubSourceChange={setSubSource}
        sourceLocked={lockSource}
      />

      <BulkUploadMainContent
        dragActive={dragActive}
        fileBatchMap={fileBatchMap}
        layoutClasses={layoutClasses}
        previewUrl={previewUrl}
        selectedFileIndex={selectedFileIndex}
        selectedFiles={selectedFiles}
        onDragActiveChange={handleDragActiveChange}
        onFiles={handleFiles}
        onRemoveFile={removeFile}
        onSelectedFileIndexChange={setSelectedFileIndex}
        onViewerFileChange={setFileViewerFile}
        onViewerOpenChange={setFileViewerOpen}
      />

      {shouldShowBulkUploadProgress(uploading) ? (
        <BulkUploadProgress
          totalFiles={totalFiles}
          uploadProgress={uploadProgress}
        />
      ) : null}
    </>
  );

  const viewer = (
    <FileViewerModal
      isOpen={fileViewerOpen}
      onOpenChange={setFileViewerOpen}
      file={fileViewerFile}
    />
  );

  if (presentation === 'page') {
    return (
      <section className="overflow-hidden rounded-xl border border-border/70 bg-background shadow-sm">
        <div className="border-b border-border/70 px-5 py-5 sm:px-6">
          <h2 className="text-lg font-semibold tracking-[-0.015em]">{title}</h2>
          <p className="mt-1 text-sm leading-5 text-muted-foreground">{description}</p>
        </div>
        <div className="space-y-5 px-5 py-5 sm:px-6 sm:py-6">
          {workflowBody}
        </div>
        <BulkUploadFooter
          totalFiles={totalFiles}
          uploading={uploading}
          onCancelUpload={cancelUpload}
          onConfirmUpload={handleConfirmUpload}
          embedded
          onClose={() => handleModalClose(false)}
        />
        {viewer}
      </section>
    );
  }

  const isDrawer = presentation === 'drawer';

  return (
    <Dialog open={isOpen} onOpenChange={handleModalClose}>
      <DialogContent
        ref={modalContentRef}
        placement={isDrawer ? 'right' : 'center'}
        className={isDrawer ? 'sm:max-w-3xl lg:max-w-4xl' : 'max-w-5xl'}
        dialogId={isDrawer ? 'bulk-upload-cvs-drawer' : 'bulk-upload-cvs-dialog'}
        onEscapeKeyDown={(event) => {
          if (uploading) event.preventDefault();
        }}
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        {isDrawer ? (
          <>
            <DialogHeader className="border-b border-border/70 px-5 py-5 sm:px-6">
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription>{description}</DialogDescription>
            </DialogHeader>
            <div className="min-h-0 space-y-5 overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">
              {workflowBody}
            </div>
            <div className="border-t border-border/70 px-5 py-4 sm:px-6">
              <BulkUploadFooter
                totalFiles={totalFiles}
                uploading={uploading}
                onCancelUpload={cancelUpload}
                onConfirmUpload={handleConfirmUpload}
              />
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription>{description}</DialogDescription>
            </DialogHeader>
            <div className="space-y-5">{workflowBody}</div>
            <BulkUploadFooter
              totalFiles={totalFiles}
              uploading={uploading}
              onCancelUpload={cancelUpload}
              onConfirmUpload={handleConfirmUpload}
            />
          </>
        )}
        {viewer}
      </DialogContent>
    </Dialog>
  );
}

export default BulkUploadCVsModal;
