import {
  ArrowPathIcon as Loader2,
  ArrowUpTrayIcon as UploadCloud,
} from "@heroicons/react/24/outline";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import type { FileWithTag } from "./upload-attachments-modal-types";
import {
  UploadAttachmentEmptyTagHint,
  UploadAttachmentFileRow,
} from "./UploadAttachmentFileListParts";

interface UploadAttachmentDropzoneProps {
  isUploading: boolean;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export function UploadAttachmentDropzone({
  isUploading,
  onFileChange,
}: UploadAttachmentDropzoneProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="attachments-file">Select Files</Label>
      <div className="flex items-center justify-center w-full">
        <label
          htmlFor="attachments-file"
          className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer bg-muted hover:bg-accent transition-colors"
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <UploadCloud className="w-8 h-8 mb-4 text-muted-foreground" />
            <p className="mb-2 text-sm text-muted-foreground">
              <span className="font-semibold">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-muted-foreground">
              PDF, DOC, DOCX, Images, TXT (max 10MB each)
            </p>
          </div>
          <Input
            id="attachments-file"
            type="file"
            className="hidden"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.txt"
            multiple
            onChange={onFileChange}
            disabled={isUploading}
          />
        </label>
      </div>
    </div>
  );
}

interface UploadAttachmentFileListProps {
  filesWithTags: FileWithTag[];
  isUploading: boolean;
  onRemoveFile: (index: number) => void;
  onUpdateFileTag: (index: number, tag: string) => void;
}

export function UploadAttachmentFileList({
  filesWithTags,
  isUploading,
  onRemoveFile,
  onUpdateFileTag,
}: UploadAttachmentFileListProps) {
  if (filesWithTags.length === 0) {
    return <UploadAttachmentEmptyTagHint />;
  }

  return (
    <div className="space-y-2">
      <Label>Selected Files ({filesWithTags.length})</Label>
      <div className="max-h-48 overflow-y-auto space-y-2">
        {filesWithTags.map(({ file, tag }, index) => (
          <UploadAttachmentFileRow
            key={`${file.name}-${file.size}-${index}`}
            file={file}
            tag={tag}
            index={index}
            isUploading={isUploading}
            onRemoveFile={onRemoveFile}
            onUpdateFileTag={onUpdateFileTag}
          />
        ))}
      </div>
    </div>
  );
}

interface UploadAttachmentActionsProps {
  fileCount: number;
  isUploading: boolean;
  onClose: () => void;
  onUpload: () => void;
}

export function UploadAttachmentActions({
  fileCount,
  isUploading,
  onUpload,
}: UploadAttachmentActionsProps) {
  return (
    <div className="flex justify-end space-x-2">
      <Button onClick={onUpload} disabled={fileCount === 0 || isUploading}>
        {isUploading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Uploading...
          </>
        ) : (
          `Upload ${fileCount} File${fileCount !== 1 ? "s" : ""}`
        )}
      </Button>
    </div>
  );
}
