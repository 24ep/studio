"use client";

import type { Dispatch, SetStateAction } from 'react';

import {
  addBaseItemToGroup,
  createBaseGroup,
  createBaseItem,
  deleteBaseGroup,
  deleteBaseItem,
  removeBaseItemFromGroup,
  updateBaseGroup,
  updateBaseItem,
  updateBaseItemStatus,
} from './base-groups-and-items-api';
import { buildBaseItemPayload } from './base-groups-and-items-utils';
import type { useBaseGroupsAndItemsDialogState } from './use-base-groups-and-items-dialog-state';

interface UseBaseGroupsAndItemsActionsInput {
  dialogState: ReturnType<typeof useBaseGroupsAndItemsDialogState>;
  fetchGroups: () => Promise<void>;
  fetchItems: () => Promise<void>;
  groupTitle: string;
  groupsEndpoint: string;
  itemTitle: string;
  itemsEndpoint: string;
  selectedGroupId: string;
  setSelectedGroupId: Dispatch<SetStateAction<string>>;
}

export function useBaseGroupsAndItemsActions({
  dialogState,
  fetchGroups,
  fetchItems,
  groupTitle,
  groupsEndpoint,
  itemTitle,
  itemsEndpoint,
  selectedGroupId,
  setSelectedGroupId,
}: UseBaseGroupsAndItemsActionsInput) {
  const handleCreateGroup = async () => {
    if (await createBaseGroup(groupsEndpoint, groupTitle, dialogState.groupFormData)) {
      dialogState.setIsCreateGroupDialogOpen(false);
      dialogState.resetGroupDialogState();
      fetchGroups();
    }
  };

  const handleUpdateGroup = async () => {
    if (!dialogState.selectedGroup) return;

    if (await updateBaseGroup(groupsEndpoint, groupTitle, dialogState.selectedGroup.id, dialogState.groupFormData)) {
      dialogState.setIsEditGroupDialogOpen(false);
      dialogState.setIsGroupDetailsDialogOpen(false);
      dialogState.resetGroupDialogState();
      fetchGroups();
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm(`Are you sure you want to delete this ${groupTitle.toLowerCase()}? This will also remove all associated ${itemTitle.toLowerCase()}.`)) {
      return;
    }

    if (await deleteBaseGroup(groupsEndpoint, groupTitle, groupId)) {
      fetchGroups();
      fetchItems();
      if (selectedGroupId === groupId) {
        setSelectedGroupId('all');
      }
    }
  };

  const handleCreateItem = async () => {
    if (await createBaseItem(itemsEndpoint, itemTitle, buildBaseItemPayload(dialogState.itemFormData))) {
      dialogState.setIsCreateItemDialogOpen(false);
      dialogState.resetItemDialogState();
      fetchItems();
    }
  };

  const handleUpdateItem = async () => {
    if (!dialogState.selectedItem) return;

    if (await updateBaseItem(
      itemsEndpoint,
      itemTitle,
      dialogState.selectedItem.id,
      buildBaseItemPayload(dialogState.itemFormData)
    )) {
      dialogState.setIsEditItemDialogOpen(false);
      dialogState.resetItemDialogState();
      fetchItems();
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm(`Are you sure you want to delete this ${itemTitle.toLowerCase()}?`)) {
      return;
    }

    if (await deleteBaseItem(itemsEndpoint, itemTitle, itemId)) {
      fetchItems();
    }
  };

  const handleToggleActive = async (itemId: string, isActive: boolean) => {
    if (await updateBaseItemStatus(itemsEndpoint, itemTitle, itemId, isActive)) {
      fetchItems();
    }
  };

  const handleAddExistingItemToGroup = async (itemId: string) => {
    const groupId = selectedGroupId === 'all' ? null : selectedGroupId;
    if (await addBaseItemToGroup(itemsEndpoint, itemTitle, itemId, groupId)) {
      dialogState.setItemSearchOpen(false);
      dialogState.setItemSearchValue('');
      fetchItems();
    }
  };

  const handleRemoveItemFromGroup = async (itemId: string) => {
    if (await removeBaseItemFromGroup(itemsEndpoint, itemTitle, itemId)) {
      fetchItems();
    }
  };

  return {
    handleAddExistingItemToGroup,
    handleCreateGroup,
    handleCreateItem,
    handleDeleteGroup,
    handleDeleteItem,
    handleRemoveItemFromGroup,
    handleToggleActive,
    handleUpdateGroup,
    handleUpdateItem,
  };
}
