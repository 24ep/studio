"use client";

import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { readJsonOrFallback } from '@/lib/response-json';
import {
  buildTreeItemGroupUpdateEndpoint,
  getTreeDragAction,
  getTreeTargetFolderGroupId,
  moveTreeItemToFolder,
  reorderTreeFolderChildren,
  reorderTreeRootFolders,
  toggleTreeFolderExpanded,
  type TreeNodeData,
} from './tree-view-utils';
import { useTreeViewCreateActions } from './use-tree-view-create-actions';
import { useTreeViewDataLoader } from './use-tree-view-data-loader';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';

interface UseTreeViewControllerOptions {
  categoriesEndpoint: string;
  itemsEndpoint: string;
  categoryTitle: string;
  itemTitle: string;
  isPersonalityTraits: boolean;
}

export function useTreeViewController({
  categoriesEndpoint,
  itemsEndpoint,
  categoryTitle,
  itemTitle,
  isPersonalityTraits,
}: UseTreeViewControllerOptions) {
  const {
    categories,
    data,
    fetchData,
    loading,
    setData,
  } = useTreeViewDataLoader({ categoriesEndpoint, itemsEndpoint });
  const [activeId, setActiveId] = useState<string | null>(null);
  const createActions = useTreeViewCreateActions({
    categoriesEndpoint,
    categoryTitle,
    fetchData,
    isPersonalityTraits,
    itemsEndpoint,
    itemTitle,
  });

  const handleToggle = (nodeId: string) => {
    setData(prevData => toggleTreeFolderExpanded(prevData, nodeId));
  };

  const moveItemToFolder = async (item: TreeNodeData, targetFolder: TreeNodeData) => {
    const newGroupId = getTreeTargetFolderGroupId(targetFolder);

    try {
      const updateEndpoint = buildTreeItemGroupUpdateEndpoint(isPersonalityTraits, item.id);

      const response = await fetch(updateEndpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId: newGroupId }),
      });

      if (!response.ok) {
        const error = await readJsonOrFallback<{ message?: string; error?: string }>(response, { error: 'Failed to update item' });
        throw new Error(error.message || error.error || 'Failed to update item');
      }

      setData(prevData => moveTreeItemToFolder(prevData, item.id, targetFolder.id));
      toast.success(`${itemTitle} moved to ${targetFolder.name}`);
      await fetchData();
    } catch (error) {
      console.error('Error moving item to folder:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to move item');
      await fetchData();
    }
  };

  const reorderItemsInFolder = (activeItem: TreeNodeData, targetItem: TreeNodeData, parent: TreeNodeData) => {
    setData(prevData => reorderTreeFolderChildren(prevData, parent.id, activeItem.id, targetItem.id));
    toast.success(`${itemTitle} reordered`);
  };

  const reorderFolders = (activeFolder: TreeNodeData, targetFolder: TreeNodeData) => {
    setData(prevData => reorderTreeRootFolders(prevData, activeFolder.id, targetFolder.id));
    toast.success(`${categoryTitle} reordered`);
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      setActiveId(null);
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId === overId) {
      setActiveId(null);
      return;
    }

    const action = getTreeDragAction(data, activeId, overId);

    if (!action) {
      setActiveId(null);
      return;
    }

    switch (action.type) {
      case 'move-file-to-folder':
        moveItemToFolder(action.activeItem, action.targetItem);
        break;
      case 'reorder-files-in-folder':
        reorderItemsInFolder(action.activeItem, action.targetItem, action.targetParent);
        break;
      case 'reorder-folders':
        reorderFolders(action.activeItem, action.targetItem);
        break;
      case 'unsupported-folder-drop':
        toast.error('Folders can only be reordered at the root level');
        break;
    }

    setActiveId(null);
  };

  return {
    data,
    categories,
    loading,
    isCreateCategoryDialogOpen: createActions.isCreateCategoryDialogOpen,
    setIsCreateCategoryDialogOpen: createActions.setIsCreateCategoryDialogOpen,
    isCreateItemDialogOpen: createActions.isCreateItemDialogOpen,
    setIsCreateItemDialogOpen: createActions.setIsCreateItemDialogOpen,
    showAdvancedConfigItem: createActions.showAdvancedConfigItem,
    setShowAdvancedConfigItem: createActions.setShowAdvancedConfigItem,
    categoryFormData: createActions.categoryFormData,
    setCategoryFormData: createActions.setCategoryFormData,
    itemFormData: createActions.itemFormData,
    setItemFormData: createActions.setItemFormData,
    mainIconFile: createActions.mainIconFile,
    mainIconPreview: createActions.mainIconPreview,
    activeId,
    fetchData,
    handleToggle,
    handleCreateCategory: createActions.handleCreateCategory,
    handleCreateItem: createActions.handleCreateItem,
    handleMainFileUpload: createActions.handleMainFileUpload,
    removeMainIcon: createActions.removeMainIcon,
    handleDragStart,
    handleDragEnd,
  };
}
