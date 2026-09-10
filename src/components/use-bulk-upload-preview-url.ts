"use client";

import { useEffect, useState, type Dispatch, type SetStateAction } from "react";

import { getBulkUploadSelectedFileIndex } from "./bulk-upload-cvs-utils";

export function useBulkUploadPreviewUrl({
  selectedFileIndex,
  selectedFiles,
  setSelectedFileIndex,
}: {
  selectedFileIndex: number;
  selectedFiles: File[];
  setSelectedFileIndex: Dispatch<SetStateAction<number>>;
}) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (selectedFiles.length > 0) {
      const index = getBulkUploadSelectedFileIndex(selectedFileIndex, selectedFiles.length);
      const url = URL.createObjectURL(selectedFiles[index]);
      setPreviewUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    }

    setPreviewUrl(null);
    setSelectedFileIndex(0);
  }, [selectedFiles, selectedFileIndex, setSelectedFileIndex]);

  return previewUrl;
}
