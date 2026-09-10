"use client";

import { useCallback, type Dispatch, type SetStateAction } from "react";
import { toast } from "react-hot-toast";
import { v4 as uuidv4 } from "uuid";

import {
  appendBulkCvFilesWithBatchIds,
  validateBulkCvFiles,
} from "./bulk-upload-cvs-utils";

export function useBulkUploadFileSelection({
  fileBatchMap,
  setFileBatchMap,
  setSelectedFiles,
}: {
  fileBatchMap: Record<string, string>;
  setFileBatchMap: Dispatch<SetStateAction<Record<string, string>>>;
  setSelectedFiles: Dispatch<SetStateAction<File[]>>;
}) {
  const handleFiles = useCallback((files: FileList | null) => {
    if (!files) return;

    const { validFiles, errors } = validateBulkCvFiles(Array.from(files));

    if (errors.length > 0) {
      errors.forEach((error) => toast.error(error));
    }

    if (validFiles.length > 0) {
      setSelectedFiles((previousFiles) => {
        const next = appendBulkCvFilesWithBatchIds({
          existingFiles: previousFiles,
          existingBatchMap: fileBatchMap,
          newFiles: validFiles,
          createBatchId: uuidv4,
        });
        setFileBatchMap(() => next.batchMap);
        return next.files;
      });
    }
  }, [fileBatchMap, setFileBatchMap, setSelectedFiles]);

  const removeFile = useCallback((fileToRemove: File) => {
    setSelectedFiles((previousFiles) => previousFiles.filter((file) => file !== fileToRemove));
    setFileBatchMap((previousMap) => {
      const nextMap = { ...previousMap };
      delete nextMap[fileToRemove.name];
      return nextMap;
    });
  }, [setFileBatchMap, setSelectedFiles]);

  return {
    handleFiles,
    removeFile,
  };
}
