import { useCallback, useEffect, useState } from "react";

import {
  getUploadQueueSelectionMode,
  toggleUploadQueueSelectAll,
  toggleUploadQueueSelectedItem,
} from "./applicant-import-queue-utils";
import type { QueueItem } from "./applicant-import-queue-types";

export function useApplicantImportUploadQueueSelection(items?: QueueItem[]) {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [selectionMode, setSelectionMode] = useState<"none" | "partial" | "all">("none");

  useEffect(() => {
    if (!items) {
      setSelectionMode("none");
      return;
    }

    setSelectionMode(getUploadQueueSelectionMode(selectedItems, items));
  }, [items, selectedItems]);

  const handleSelectAll = useCallback(() => {
    if (!items) return;

    setSelectedItems((currentSelectedItems) =>
      toggleUploadQueueSelectAll(currentSelectedItems, items, selectionMode)
    );
  }, [items, selectionMode]);

  const handleSelectItem = useCallback((itemId: string) => {
    setSelectedItems((currentSelectedItems) => toggleUploadQueueSelectedItem(currentSelectedItems, itemId));
  }, []);

  const clearSelection = useCallback(() => setSelectedItems(new Set()), []);

  return {
    clearSelection,
    handleSelectAll,
    handleSelectItem,
    selectedItems,
    selectionMode,
    setSelectedItems,
  };
}
