import { useCallback, useState } from "react";

import {
  createUploadQueuePreviewFile,
} from "./applicant-import-queue-utils";
import type { QueueItem } from "./applicant-import-queue-types";

type PreviewFile = {
  fileName: string;
  url: string;
  label?: string;
  updatedAt?: string;
  fileSize?: number | string;
};

export function useApplicantImportUploadQueueUiState() {
  const [selectedItem, setSelectedItem] = useState<QueueItem | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedFile, setSelectedFile] = useState<PreviewFile | null>(null);
  const [isFileViewerOpen, setIsFileViewerOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [openSelect, setOpenSelect] = useState<string | null>(null);

  const handleFilePreview = useCallback((item: QueueItem) => {
    setSelectedFile(createUploadQueuePreviewFile(item));
    setIsFileViewerOpen(true);
  }, []);

  const handleShowDetails = useCallback((item: QueueItem) => {
    setSelectedItem(item);
    setShowDetails(true);
  }, []);

  const handleMenuClick = useCallback((menu: string) => {
    setOpenMenu((currentMenu) => (currentMenu === menu ? null : menu));
  }, []);

  const handleOpenChange = useCallback((menu: string) => (open: boolean) => {
    setOpenMenu(open ? menu : null);
  }, []);

  return {
    handleFilePreview,
    handleMenuClick,
    handleOpenChange,
    handleShowDetails,
    isFileViewerOpen,
    openMenu,
    openSelect,
    selectedFile,
    selectedItem,
    setIsFileViewerOpen,
    setOpenMenu,
    setOpenSelect,
    setSelectedItem,
    setShowDetails,
    showDetails,
  };
}
