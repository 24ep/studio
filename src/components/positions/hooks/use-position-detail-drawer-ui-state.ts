"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { PositionDetailTabId } from "../PositionDetailTabsNav";
import { getPositionDrawerSheetOpenChangeAction } from "../position-detail-drawer-utils";

export function usePositionDetailDrawerUiState({
  initialEditMode,
  isMobile,
  isOpen,
  onOpenChange,
}: {
  initialEditMode: boolean;
  isMobile: boolean;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const manualCloseRequested = useRef(false);
  const [hasMounted, setHasMounted] = useState(false);
  const [selectedApplicantId, setSelectedApplicantId] = useState<string | null>(null);
  const [isApplicantModalOpen, setIsApplicantModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState<PositionDetailTabId>("details");

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setIsEditMode(initialEditMode);
      manualCloseRequested.current = false;
      return;
    }

    setIsEditMode(false);
  }, [isOpen, initialEditMode]);

  const handleManualClose = useCallback(() => {
    manualCloseRequested.current = true;
    onOpenChange(false);
  }, [onOpenChange]);

  const handleSheetOpenChange = useCallback((open: boolean) => {
    const action = getPositionDrawerSheetOpenChangeAction({
      nextOpen: open,
      isMobile,
      manualCloseRequested: manualCloseRequested.current,
    });

    if (action.shouldResetManualCloseRequest) {
      manualCloseRequested.current = false;
    }

    if (action.shouldNotifyOpenChange) {
      onOpenChange(action.nextOpen);
    }
  }, [onOpenChange, isMobile]);

  const handleApplicantClick = useCallback((applicantId: string) => {
    setSelectedApplicantId(applicantId);
    setIsApplicantModalOpen(true);
  }, []);

  const closeApplicantModal = useCallback(() => {
    setIsApplicantModalOpen(false);
    setSelectedApplicantId(null);
  }, []);

  return {
    activeTab,
    closeApplicantModal,
    handleApplicantClick,
    handleManualClose,
    handleSheetOpenChange,
    hasMounted,
    isApplicantModalOpen,
    isEditMode,
    selectedApplicantId,
    setActiveTab,
    setIsEditMode,
  };
}
