import React from 'react';
import { DragDropUploadProgressList, DragDropUploadZone } from './drag-drop-upload-parts';
import { useDragDropUpload } from './use-drag-drop-upload';
export type { UploadFile } from './drag-drop-upload-utils';

interface DragDropUploadProps {
  onUpload: (files: File[], onProgress?: (fileId: string, progress: number) => void) => Promise<void>;
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  maxFileSize?: number;
  disabled?: boolean;
  className?: string;
}

const DragDropUpload: React.FC<DragDropUploadProps> = ({
  onUpload,
  accept = 'application/pdf,.doc,.docx,.rtf',
  multiple = true,
  maxFiles = 10,
  maxFileSize = 10 * 1024 * 1024,
  disabled = false,
  className = '',
}) => {
  const upload = useDragDropUpload({
    disabled,
    maxFiles,
    maxFileSize,
    onUpload,
  });

  return (
    <div className={`space-y-4 ${className}`}>
      <DragDropUploadZone
        disabled={disabled}
        isDragOver={upload.isDragOver}
        maxFileSize={maxFileSize}
        multiple={multiple}
        onClick={() => !disabled && upload.fileInputRef.current?.click()}
        onDragLeave={upload.handleDragLeave}
        onDragOver={upload.handleDragOver}
        onDrop={upload.handleDrop}
      />

      <input
        ref={upload.fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={upload.handleFileInputChange}
        className="hidden"
        disabled={disabled}
      />

      <DragDropUploadProgressList
        onRemoveFile={upload.removeFile}
        uploadFiles={upload.uploadFiles}
      />
    </div>
  );
};

export default DragDropUpload;
