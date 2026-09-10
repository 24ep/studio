"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import FileUploadArea from "@/components/ui/FileUploadArea";
import { PositionMultiSelectDropdown } from "@/components/applicants/PositionMultiSelectDropdown";
import { SourceSingleSelectDropdown } from "@/components/applicants/SourceSingleSelectDropdown";
import type { ApplicantSource } from "@/lib/types";

import { BulkUploadFileList } from "./BulkUploadCVsModalParts";
import {
  BULK_CV_ACCEPT,
  BULK_CV_MAX_FILE_SIZE,
  getBulkUploadSourceAllowsSubSource,
  shouldShowBulkUploadFileList,
} from "./bulk-upload-cvs-utils";
import type { BulkUploadViewerFile } from "./bulk-upload-cvs-utils";

interface BulkUploadSelectionFieldsProps {
  availableSources: ApplicantSource[];
  selectedPositionIds: Set<string>;
  selectedSourceId: string;
  subSource: string;
  uploading: boolean;
  onPositionChange: (value: Set<string>) => void;
  onSourceChange: (value: string) => void;
  onSubSourceChange: (value: string) => void;
  sourceLocked?: boolean;
}

export function BulkUploadSelectionFields({
  availableSources,
  selectedPositionIds,
  selectedSourceId,
  subSource,
  uploading,
  onPositionChange,
  onSourceChange,
  onSubSourceChange,
  sourceLocked = false,
}: BulkUploadSelectionFieldsProps) {
  const showSubSourceInput = getBulkUploadSourceAllowsSubSource(availableSources, selectedSourceId);

  return (
    <>
      <div>
        <Label htmlFor="position-select">Assign to Position</Label>
        <div className="mt-2">
          <PositionMultiSelectDropdown
            selectedIds={selectedPositionIds}
            onSelectionChange={onPositionChange}
            placeholder="Select a position..."
            disabled={uploading}
            showOpenStatus={true}
            filterOpenOnly={false}
            singleSelect={true}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="source-select">Source</Label>
        <div className="mt-2">
          <SourceSingleSelectDropdown
            value={selectedSourceId}
            onChange={onSourceChange}
            availableSources={availableSources}
            placeholder="Select a source..."
            disabled={uploading || sourceLocked}
          />
        </div>
      </div>

      {showSubSourceInput && (
        <div>
          <Label htmlFor="sub-source-input">Sub-source (optional)</Label>
          <div className="mt-2">
            <Input
              id="sub-source-input"
              type="text"
              value={subSource}
              onChange={(event) => onSubSourceChange(event.target.value)}
              placeholder="Enter sub-source..."
              disabled={uploading}
            />
          </div>
        </div>
      )}
    </>
  );
}

interface BulkUploadMainContentProps {
  dragActive: boolean;
  fileBatchMap: Record<string, string>;
  layoutClasses: {
    gridClassName: string;
    uploadAreaClassName: string;
  };
  previewUrl: string | null;
  selectedFileIndex: number;
  selectedFiles: File[];
  onDragActiveChange: (active: boolean) => void;
  onFiles: (files: FileList | null) => void;
  onRemoveFile: (file: File) => void;
  onSelectedFileIndexChange: (index: number) => void;
  onViewerFileChange: (file: BulkUploadViewerFile) => void;
  onViewerOpenChange: (open: boolean) => void;
}

export function BulkUploadMainContent({
  dragActive,
  fileBatchMap,
  layoutClasses,
  previewUrl,
  selectedFileIndex,
  selectedFiles,
  onDragActiveChange,
  onFiles,
  onRemoveFile,
  onSelectedFileIndexChange,
  onViewerFileChange,
  onViewerOpenChange,
}: BulkUploadMainContentProps) {
  return (
    <div className={layoutClasses.gridClassName}>
      <div className={layoutClasses.uploadAreaClassName}>
        <FileUploadArea
          key="bulk-upload-area"
          accept={BULK_CV_ACCEPT}
          multiple={true}
          maxFileSize={BULK_CV_MAX_FILE_SIZE}
          onFilesChange={onFiles}
          dragActive={dragActive}
          setDragActive={onDragActiveChange}
        />
      </div>

      {shouldShowBulkUploadFileList(selectedFiles.length) && (
        <BulkUploadFileList
          selectedFiles={selectedFiles}
          selectedFileIndex={selectedFileIndex}
          fileBatchMap={fileBatchMap}
          previewUrl={previewUrl}
          onSelectedFileIndexChange={onSelectedFileIndexChange}
          onViewerFileChange={onViewerFileChange}
          onViewerOpenChange={onViewerOpenChange}
          onRemoveFile={onRemoveFile}
        />
      )}
    </div>
  );
}
