"use client";

import { useCallback, useEffect, useState } from 'react';

import {
  fetchBaseGroups,
  fetchBaseItems,
} from './base-groups-and-items-api';
import {
  getAvailableItemsForGroup,
  getItemsForSelectedGroup,
} from './base-groups-and-items-utils';
import { useBaseGroupsAndItemsActions } from './use-base-groups-and-items-actions';
import { useBaseGroupsAndItemsDialogState } from './use-base-groups-and-items-dialog-state';
import { useBaseGroupsAndItemsDrag } from './use-base-groups-and-items-drag';
import type {
  BaseGroup,
  BaseGroupsAndItemsTabProps,
  BaseItem,
} from './BaseGroupsAndItemsParts';

type UseBaseGroupsAndItemsControllerParams = Pick<
  BaseGroupsAndItemsTabProps,
  'groupTitle' | 'itemTitle' | 'groupsEndpoint' | 'itemsEndpoint'
> & {
  showSkillFields: boolean;
};

export function useBaseGroupsAndItemsController({
  groupTitle,
  itemTitle,
  groupsEndpoint,
  itemsEndpoint,
  showSkillFields,
}: UseBaseGroupsAndItemsControllerParams) {
  const [groups, setGroups] = useState<BaseGroup[]>([]);
  const [items, setItems] = useState<BaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroupId, setSelectedGroupId] = useState('all');

  const dialogState = useBaseGroupsAndItemsDialogState({
    selectedGroupId,
    showSkillFields,
  });

  const fetchGroups = useCallback(async () => {
    setGroups(await fetchBaseGroups(groupsEndpoint, groupTitle));
    setLoading(false);
  }, [groupsEndpoint, groupTitle]);

  const fetchItems = useCallback(async () => {
    setItems(await fetchBaseItems(itemsEndpoint, itemTitle));
  }, [itemsEndpoint, itemTitle]);

  useEffect(() => {
    fetchGroups();
    fetchItems();
  }, [fetchGroups, fetchItems]);

  const {
    handleGroupDragEnd,
    handleItemDragEnd,
  } = useBaseGroupsAndItemsDrag({
    fetchGroups,
    fetchItems,
    groupTitle,
    groups,
    groupsEndpoint,
    itemTitle,
    items,
    itemsEndpoint,
    selectedGroupId,
    setGroups,
    setItems,
  });

  const actions = useBaseGroupsAndItemsActions({
    dialogState,
    fetchGroups,
    fetchItems,
    groupTitle,
    groupsEndpoint,
    itemTitle,
    itemsEndpoint,
    selectedGroupId,
    setSelectedGroupId,
  });

  return {
    groups,
    items,
    loading,
    selectedGroupId,
    setSelectedGroupId,
    isCreateGroupDialogOpen: dialogState.isCreateGroupDialogOpen,
    setIsCreateGroupDialogOpen: dialogState.setIsCreateGroupDialogOpen,
    isEditGroupDialogOpen: dialogState.isEditGroupDialogOpen,
    setIsEditGroupDialogOpen: dialogState.setIsEditGroupDialogOpen,
    isCreateItemDialogOpen: dialogState.isCreateItemDialogOpen,
    setIsCreateItemDialogOpen: dialogState.setIsCreateItemDialogOpen,
    isEditItemDialogOpen: dialogState.isEditItemDialogOpen,
    setIsEditItemDialogOpen: dialogState.setIsEditItemDialogOpen,
    isGroupDetailsDialogOpen: dialogState.isGroupDetailsDialogOpen,
    setIsGroupDetailsDialogOpen: dialogState.setIsGroupDetailsDialogOpen,
    selectedGroup: dialogState.selectedGroup,
    itemSearchOpen: dialogState.itemSearchOpen,
    setItemSearchOpen: dialogState.setItemSearchOpen,
    itemSearchValue: dialogState.itemSearchValue,
    setItemSearchValue: dialogState.setItemSearchValue,
    previewUrl: dialogState.previewUrl,
    groupFormData: dialogState.groupFormData,
    setGroupFormData: dialogState.setGroupFormData,
    itemFormData: dialogState.itemFormData,
    setItemFormData: dialogState.setItemFormData,
    filteredItems: getItemsForSelectedGroup(items, selectedGroupId),
    availableItems: getAvailableItemsForGroup(items, selectedGroupId),
    handleCreateGroup: actions.handleCreateGroup,
    handleUpdateGroup: actions.handleUpdateGroup,
    handleDeleteGroup: actions.handleDeleteGroup,
    handleCreateItem: actions.handleCreateItem,
    handleUpdateItem: actions.handleUpdateItem,
    handleDeleteItem: actions.handleDeleteItem,
    handleToggleActive: actions.handleToggleActive,
    handleAddExistingItemToGroup: actions.handleAddExistingItemToGroup,
    handleRemoveItemFromGroup: actions.handleRemoveItemFromGroup,
    handleGroupDragEnd,
    handleItemDragEnd,
    handleFileSelect: dialogState.handleFileSelect,
    handleRemoveFile: dialogState.handleRemoveFile,
    openEditGroupDialog: dialogState.openEditGroupDialog,
    openEditItemDialog: dialogState.openEditItemDialog,
    openCreateItemDialog: dialogState.openCreateItemDialog,
    openGroupDetailsDialog: dialogState.openGroupDetailsDialog,
  };
}
