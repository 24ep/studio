"use client";

import { useMemo, useState } from "react";
import { toast } from "react-hot-toast";

import {
  filterUnassignedEvaluationItems,
  getSelectableItemsInGroup,
  toggleSelectedItemsForGroup,
  type GroupableEvaluationItem,
  type SelectedEvaluationItem,
} from "./evaluation-config-utils";

interface UseEvaluationItemPickerOptions<TItem extends GroupableEvaluationItem> {
  positionId: string;
  items: TItem[];
  assignedIds: string[];
  itemLabel: string;
  addItems: (positionId: string, itemIds: string[]) => Promise<void>;
  reloadItems: () => Promise<void>;
}

export function useEvaluationItemPicker<TItem extends GroupableEvaluationItem>({
  positionId,
  items,
  assignedIds,
  itemLabel,
  addItems,
  reloadItems,
}: UseEvaluationItemPickerOptions<TItem>) {
  const [isOpen, setIsOpen] = useState(false);
  const [assignedSearchTerm, setAssignedSearchTerm] = useState("");
  const [modalSearchTerm, setModalSearchTerm] = useState("");
  const [selectedItems, setSelectedItems] = useState<SelectedEvaluationItem[]>([]);
  const [isAdding, setIsAdding] = useState(false);

  const filteredModalItems = useMemo(() => (
    filterUnassignedEvaluationItems(items, assignedIds, modalSearchTerm)
  ), [assignedIds, items, modalSearchTerm]);

  const reset = () => {
    setIsOpen(false);
    setSelectedItems([]);
    setModalSearchTerm("");
  };

  const handleAddItems = async () => {
    if (selectedItems.length === 0) return;

    setIsAdding(true);
    try {
      await addItems(positionId, selectedItems.map(item => item.id));
      toast.success(`${selectedItems.length} ${itemLabel}${selectedItems.length > 1 ? "s" : ""} added successfully`);
      reset();
      await reloadItems();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsAdding(false);
    }
  };

  const handleSelectItem = (itemId: string) => {
    const existing = selectedItems.find(item => item.id === itemId);
    if (existing) {
      setSelectedItems(previous => previous.filter(item => item.id !== itemId));
      return;
    }

    const item = items.find(candidate => candidate.id === itemId);
    if (item) {
      setSelectedItems(previous => [...previous, { id: item.id, name: item.name }]);
    }
  };

  const handleToggleSelectAllInGroup = (groupId: string | "ungrouped") => {
    const groupItems = getSelectableItemsInGroup(items, new Set(assignedIds), groupId, modalSearchTerm);
    if (groupItems.length > 0) {
      setSelectedItems(previous => toggleSelectedItemsForGroup(previous, groupItems));
    }
  };

  const handleRemoveSelectedItem = (itemId: string) => {
    setSelectedItems(previous => previous.filter(item => item.id !== itemId));
  };

  return {
    isOpen,
    setIsOpen,
    assignedSearchTerm,
    setAssignedSearchTerm,
    modalSearchTerm,
    setModalSearchTerm,
    selectedItems,
    isAdding,
    filteredModalItems,
    handleAddItems,
    handleSelectItem,
    handleToggleSelectAllInGroup,
    handleRemoveSelectedItem,
    handleCancelAddItems: reset,
  };
}
