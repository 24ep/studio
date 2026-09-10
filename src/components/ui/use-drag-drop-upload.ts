import { useCallback, useEffect, useRef, useState } from 'react';

import {
  createUploadFileEntries,
  markMatchingUploadFilesStatus,
  removeCompletedUploadFiles,
  updateUploadFileProgress,
  validateDragDropUploadFile,
  type UploadFile,
} from './drag-drop-upload-utils';

interface UseDragDropUploadOptions {
  disabled: boolean;
  maxFiles: number;
  maxFileSize: number;
  onUpload: (files: File[], onProgress?: (fileId: string, progress: number) => void) => Promise<void>;
}

export function useDragDropUpload({
  disabled,
  maxFiles,
  maxFileSize,
  onUpload,
}: UseDragDropUploadOptions) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const clearUploadsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const processFiles = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const validFiles = fileArray.filter((file) => {
      const error = validateDragDropUploadFile(file, maxFileSize);
      if (error) {
        console.error('File validation error:', `${file.name}: ${error}`);
        return false;
      }
      return true;
    });

    if (validFiles.length > 0) {
      setUploadFiles((currentFiles) => (
        [...currentFiles, ...createUploadFileEntries(validFiles)].slice(0, maxFiles)
      ));
    }

    return validFiles;
  }, [maxFileSize, maxFiles]);

  const handleUpload = useCallback(async (files: File[]) => {
    try {
      const onProgress = (fileId: string, progress: number) => {
        setUploadFiles((currentFiles) => updateUploadFileProgress(currentFiles, fileId, progress));
      };

      setUploadFiles((currentFiles) => markMatchingUploadFilesStatus(currentFiles, files, 'uploading'));

      await onUpload(files, onProgress);

      if (clearUploadsTimeoutRef.current) {
        clearTimeout(clearUploadsTimeoutRef.current);
      }
      clearUploadsTimeoutRef.current = setTimeout(() => {
        setUploadFiles(removeCompletedUploadFiles);
      }, 3000);
    } catch (error) {
      console.error('Upload error:', error);
      setUploadFiles((currentFiles) => markMatchingUploadFilesStatus(currentFiles, files, 'error', 'Upload failed'));
    }
  }, [onUpload]);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    if (!disabled) {
      setIsDragOver(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);

    if (disabled) return;

    const files = event.dataTransfer.files;
    if (files.length > 0) {
      const validFiles = processFiles(files);
      if (validFiles.length > 0) {
        void handleUpload(validFiles);
      }
    }
  }, [disabled, handleUpload, processFiles]);

  const handleFileInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const validFiles = processFiles(files);
      if (validFiles.length > 0) {
        void handleUpload(validFiles);
      }
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [handleUpload, processFiles]);

  const removeFile = useCallback((fileId: string) => {
    setUploadFiles((currentFiles) => currentFiles.filter((uploadFile) => uploadFile.id !== fileId));
  }, []);

  useEffect(() => {
    return () => {
      if (clearUploadsTimeoutRef.current) {
        clearTimeout(clearUploadsTimeoutRef.current);
      }
    };
  }, []);

  return {
    fileInputRef,
    handleDragLeave,
    handleDragOver,
    handleDrop,
    handleFileInputChange,
    isDragOver,
    removeFile,
    uploadFiles,
  };
}
