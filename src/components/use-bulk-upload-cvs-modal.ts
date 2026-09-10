import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import { useSession } from "next-auth/react";
import { v4 as uuidv4 } from "uuid";

import { useToast } from "@/hooks/use-toast";
import { hasAnyPermission } from "@/lib/permissions";

import { uploadBulkCvFiles } from "./bulk-upload-cvs-api";
import {
  getBulkUploadErrorToast,
  getBulkUploadSuccessToast,
  getInitialBulkUploadModalFormState,
  resolveBulkUploadPositionSelection,
  type BulkUploadViewerFile,
} from "./bulk-upload-cvs-utils";
import { useBulkUploadFileSelection } from "./use-bulk-upload-file-selection";
import { useBulkUploadModalGuards } from "./use-bulk-upload-modal-guards";
import { useBulkUploadPreviewUrl } from "./use-bulk-upload-preview-url";
import { useBulkUploadSources } from "./use-bulk-upload-sources";

interface UseBulkUploadCvsModalInput {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onUploadSuccess?: () => void;
  initialSourceName?: string;
}

const BULK_UPLOAD_EMPTY_TOAST_ID = "bulk-upload-cvs-empty-selection";
const BULK_UPLOAD_RESULT_TOAST_ID = "bulk-upload-cvs-result";

export function useBulkUploadCvsModal({
  isOpen,
  onOpenChange,
  onUploadSuccess,
  initialSourceName,
}: UseBulkUploadCvsModalInput) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selectedPositionId, setSelectedPositionId] = useState<string>("");
  const [selectedPositionIds, setSelectedPositionIds] = useState<Set<string>>(new Set());
  const [selectedSourceId, setSelectedSourceId] = useState<string>("");
  const [subSource, setSubSource] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null);
  const { data: session } = useSession();
  const [fileBatchMap, setFileBatchMap] = useState<Record<string, string>>({});
  const [selectedFileIndex, setSelectedFileIndex] = useState<number>(0);
  const { successWithDescription, errorWithDescription } = useToast();
  const [fileViewerOpen, setFileViewerOpen] = useState(false);
  const [fileViewerFile, setFileViewerFile] = useState<BulkUploadViewerFile | null>(null);
  const modalContentRef = useRef<HTMLDivElement>(null);
  const uploadInFlightRef = useRef(false);
  const availableSources = useBulkUploadSources(isOpen);

  useEffect(() => {
    if (!isOpen || !initialSourceName || selectedSourceId) return;
    const initialSource = availableSources.find(
      (source) => source.name.trim().toLowerCase() === initialSourceName.trim().toLowerCase(),
    );
    if (initialSource) setSelectedSourceId(initialSource.id);
  }, [availableSources, initialSourceName, isOpen, selectedSourceId]);
  const previewUrl = useBulkUploadPreviewUrl({
    selectedFileIndex,
    selectedFiles,
    setSelectedFileIndex,
  });
  useBulkUploadModalGuards(isOpen);
  const { handleFiles, removeFile } = useBulkUploadFileSelection({
    fileBatchMap,
    setFileBatchMap,
    setSelectedFiles,
  });

  const canBulkUpload = useMemo(() => {
    return hasAnyPermission(session?.user, initialSourceName === 'Employee Referral'
      ? ["BULK_UPLOAD_EXECUTE", "FRIEND_REFERRALS_ACCESS"]
      : ["BULK_UPLOAD_EXECUTE"]);
  }, [initialSourceName, session?.user]);

  const handleDragActiveChange = useCallback((active: boolean) => {
    setDragActive(active);
  }, []);

  const handlePositionChange = useCallback((ids: Set<string>) => {
    const selection = resolveBulkUploadPositionSelection(ids);
    setSelectedPositionIds(selection.selectedPositionIds);
    setSelectedPositionId(selection.selectedPositionId);
  }, []);

  const resetUploadFormState = useCallback(() => {
    const state = getInitialBulkUploadModalFormState();
    setSelectedFiles(state.selectedFiles);
    setSelectedPositionId(state.selectedPositionId);
    setSelectedPositionIds(state.selectedPositionIds);
    setSelectedSourceId(state.selectedSourceId);
    setSubSource(state.subSource);
    setSelectedFileIndex(state.selectedFileIndex);
    setUploadProgress(state.uploadProgress);
    setUploading(state.uploading);
  }, []);

  const handleModalClose = useCallback((open: boolean) => {
    onOpenChange(open);
    if (!open) {
      resetUploadFormState();

      setTimeout(() => {
        try {
          const { cleanupAllModals } = require("@/lib/modal-cleanup");
          cleanupAllModals();
        } catch (error) {
          console.error("Error during modal cleanup:", error);
        }
      }, 100);
    }
  }, [onOpenChange, resetUploadFormState]);

  const handleConfirmUpload = useCallback(async (event?: MouseEvent) => {
    event?.preventDefault();
    event?.stopPropagation();

    if (uploadInFlightRef.current) {
      return;
    }

    if (selectedFiles.length === 0) {
      errorWithDescription(
        "No files selected",
        "Please select at least one PDF, Word document, or image file to upload.",
        { id: BULK_UPLOAD_EMPTY_TOAST_ID },
      );
      return;
    }

    uploadInFlightRef.current = true;
    setUploading(true);
    setUploadProgress({ current: 0, total: selectedFiles.length });

    try {
      const batchId = uuidv4();
      const { success, successful, failed, errors, queuedAfterTimeout } = await uploadBulkCvFiles({
        files: selectedFiles,
        batchId,
        positionId: selectedPositionId,
        sourceId: selectedSourceId,
        subSource,
      });

      if (success) {
        const successToast = getBulkUploadSuccessToast({ successful, failed, errors, queuedAfterTimeout });
        successWithDescription(
          successToast.title,
          successToast.description,
          { id: BULK_UPLOAD_RESULT_TOAST_ID },
        );

        resetUploadFormState();
        onOpenChange(false);

        onUploadSuccess?.();
        window.dispatchEvent(new CustomEvent("refreshApplicantQueue"));
      }
    } catch (error) {
      console.error("Upload error:", error);
      const errorToast = getBulkUploadErrorToast(error);
      errorWithDescription(
        errorToast.title,
        errorToast.description || "Please try again",
        { id: BULK_UPLOAD_RESULT_TOAST_ID },
      );
      setUploadProgress(null);
    } finally {
      uploadInFlightRef.current = false;
      setUploading(false);
    }
  }, [
    selectedFiles,
    selectedPositionId,
    selectedSourceId,
    subSource,
    onOpenChange,
    successWithDescription,
    errorWithDescription,
    onUploadSuccess,
    resetUploadFormState,
  ]);

  const cancelUpload = useCallback(() => {
    uploadInFlightRef.current = false;
    setUploading(false);
    setUploadProgress(null);
  }, []);

  return {
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
  };
}
