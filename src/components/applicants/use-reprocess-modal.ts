"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-hot-toast";

import type { Position } from "@/lib/types";
import { addAttachmentToReprocessQueue } from "./reprocess-modal-api";
import {
  filterReprocessPositions,
  getValidReprocessAttachments,
  isPdfAttachment,
  type ReprocessAttachment,
} from "./reprocess-modal-utils";
import { useReprocessModalSearchFocus } from "./use-reprocess-modal-focus";
import { useReprocessModalIsolation } from "./use-reprocess-modal-isolation";

interface UseReprocessModalOptions {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  applicantId: string;
  applicantPositionId?: string | null;
  applicantSourceId?: string | null;
  attachments: ReprocessAttachment[];
  positions: Position[];
}

export function useReprocessModal({
  isOpen,
  onOpenChange,
  applicantId,
  applicantPositionId,
  applicantSourceId,
  attachments,
  positions,
}: UseReprocessModalOptions) {
  const [selectedAttachment, setSelectedAttachment] = useState("");
  const [selectedPositionId, setSelectedPositionId] = useState(applicantPositionId || "");
  const [isProcessing, setIsProcessing] = useState(false);
  const [positionSearchTerm, setPositionSearchTerm] = useState("");
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { refocusPositionSearch, searchInputRef } = useReprocessModalSearchFocus();
  const { markModalIsolated } = useReprocessModalIsolation(isOpen);

  const validAttachments = useMemo(
    () => getValidReprocessAttachments(attachments),
    [attachments]
  );
  const selectedAttachmentData = useMemo(
    () => validAttachments.find((attachment) => attachment.id === selectedAttachment) || null,
    [selectedAttachment, validAttachments]
  );
  const filteredPositions = useMemo(
    () => filterReprocessPositions(positions, positionSearchTerm),
    [positionSearchTerm, positions]
  );

  useEffect(() => {
    if (!isOpen) return;

    setSelectedAttachment("");
    setSelectedPositionId(applicantPositionId || "");
    setIsProcessing(false);
    setPositionSearchTerm("");
    setIsPreviewLoading(false);
  }, [applicantPositionId, isOpen]);

  const handleAttachmentChange = (value: string) => {
    setSelectedAttachment(value);
    const attachment = validAttachments.find((item) => item.id === value);
    if (attachment && isPdfAttachment(attachment.fileName)) {
      setIsPreviewLoading(true);
    }
  };

  const markPreviewLoaded = () => {
    setIsPreviewLoading(false);
    markModalIsolated();
  };

  const markPreviewFailed = () => {
    console.warn("Failed to load PDF preview");
    setIsPreviewLoading(false);
  };

  const handleReprocess = async () => {
    if (!selectedAttachment) {
      toast.error("Please select an attachment to re-process");
      return;
    }

    if (!selectedPositionId) {
      toast.error("Please select a position to apply for");
      return;
    }

    if (!applicantPositionId && !selectedPositionId) {
      toast.error("Please select a position to apply for. The applicant currently has no applied position.");
      return;
    }

    if (!selectedAttachmentData) {
      toast.error("Selected attachment not found");
      return;
    }

    setIsProcessing(true);
    try {
      await addAttachmentToReprocessQueue({
        applicantId,
        applicantSourceId,
        selectedAttachmentData,
        selectedPositionId,
      });

      toast.success("File added to processing queue successfully");
      onOpenChange(false);
    } catch (error) {
      console.error("Re-process error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to add file to processing queue");
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    selectedAttachment,
    selectedPositionId,
    isProcessing,
    positionSearchTerm,
    isPreviewLoading,
    searchInputRef,
    iframeRef,
    validAttachments,
    selectedAttachmentData,
    filteredPositions,
    setSelectedPositionId,
    setPositionSearchTerm,
    handleAttachmentChange,
    refocusPositionSearch,
    markPreviewLoaded,
    markPreviewFailed,
    handleReprocess,
  };
}
